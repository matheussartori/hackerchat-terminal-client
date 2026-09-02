import { describe, it, expect, afterEach } from 'vitest'
import http from 'node:http'
import net from 'node:net'
import { createHash } from 'node:crypto'
import { SocketClient } from '../../src/network/socket-client.js'
import { WebSocketFrameDecoder } from '../../src/network/web-socket-frame.js'
import type { ServerConfig } from '../../src/types/index.js'

/** Build a server-style (unmasked) text frame. */
function serverTextFrame(text: string): Buffer {
  const payload = Buffer.from(text, 'utf8')
  let header: Buffer
  if (payload.length < 126) {
    header = Buffer.from([0x81, payload.length])
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4)
    header[0] = 0x81
    header[1] = 126
    header.writeUInt16BE(payload.length, 2)
  } else {
    header = Buffer.alloc(10)
    header[0] = 0x81
    header[1] = 127
    header.writeBigUInt64BE(BigInt(payload.length), 2)
  }
  return Buffer.concat([header, payload])
}

/**
 * Build a server-style (unmasked) control frame. Servers must never mask, so
 * this is not `encodeControlFrame`, which is the client-side encoder.
 */
function serverControlFrame(opcode: number, payload: Buffer = Buffer.alloc(0)): Buffer {
  return Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload])
}

/**
 * A throwaway server that performs the WebSocket upgrade and records every
 * frame the client sends, so tests exercise `SocketClient` over a real socket.
 */
class StubServer {
  readonly received: { type: string; data?: string }[] = []
  /** Every byte the client sent, for frames the decoder does not surface. */
  readonly rawReceived: Buffer[] = []
  private readonly sockets: net.Socket[] = []
  private readonly decoder = new WebSocketFrameDecoder()

  private constructor(
    private readonly server: http.Server,
    readonly port: number
  ) {}

  static async start(): Promise<StubServer> {
    const server = http.createServer()
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const stub = new StubServer(server, (server.address() as net.AddressInfo).port)

    server.on('upgrade', (req, socket: net.Socket) => {
      stub.sockets.push(socket)
      const key = req.headers['sec-websocket-key'] as string
      const accept = createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64')
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
          'Upgrade: WebSocket\r\n' +
          'Connection: Upgrade\r\n' +
          `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
      )
      socket.on('data', chunk => {
        stub.rawReceived.push(Buffer.from(chunk))
        for (const frame of stub.decoder.decode(chunk)) {
          stub.received.push(
            frame.type === 'text'
              ? { type: 'text', data: frame.data }
              : { type: frame.type }
          )
        }
      })
      socket.on('error', () => {})
    })

    return stub
  }

  /** Push a raw buffer down the first upgraded connection. */
  push(buffer: Buffer): void {
    this.sockets[0]?.write(buffer)
  }

  send(event: string, message: unknown): void {
    this.push(serverTextFrame(JSON.stringify({ event, message })))
  }

  async close(): Promise<void> {
    for (const socket of this.sockets) socket.destroy()
    await new Promise<void>(resolve => this.server.close(() => resolve()))
  }
}

let stub: StubServer | undefined

afterEach(async() => {
  await stub?.close()
  stub = undefined
})

function configFor(port: number): ServerConfig {
  return { hostUri: '127.0.0.1', port: String(port), protocol: 'http' }
}

/** Unmask the payload of a client control frame (2-byte header + 4-byte mask). */
function unmaskControlPayload(frame: Buffer): string {
  const len = frame[1]! & 0x7f
  const mask = frame.subarray(2, 6)
  const payload = Buffer.allocUnsafe(len)
  for (let i = 0; i < len; i++) payload[i] = frame[6 + i]! ^ mask[i % 4]!
  return payload.toString('utf8')
}

/** Give the socket a moment to deliver whatever it is going to deliver. */
const flush = () => new Promise(resolve => setTimeout(resolve, 40))

async function connectedClient(): Promise<SocketClient> {
  stub = await StubServer.start()
  const client = new SocketClient(configFor(stub.port))
  await client.connect()
  return client
}

describe('SocketClient.connect', () => {
  it('completes the WebSocket upgrade handshake', async() => {
    await connectedClient()

    expect(stub!.received).toEqual([])
  })

  it('resolves only once the upgrade has happened', async() => {
    stub = await StubServer.start()
    const client = new SocketClient(configFor(stub.port))

    await client.connect()
    client.send('joinRoom', { userName: 'alice', roomId: 'room1' })
    await flush()

    expect(stub.received).toHaveLength(1)
  })
})

describe('SocketClient.send', () => {
  it('frames the payload as an event/message envelope', async() => {
    const client = await connectedClient()

    client.send('joinRoom', { userName: 'alice', roomId: 'room1' })
    await flush()

    expect(stub!.received[0]).toEqual({
      type: 'text',
      data: '{"event":"joinRoom","message":{"userName":"alice","roomId":"room1"}}'
    })
  })

  it('sends a plain string message', async() => {
    const client = await connectedClient()

    client.send('message', 'hello')
    await flush()

    expect(stub!.received[0]).toEqual({
      type: 'text',
      data: '{"event":"message","message":"hello"}'
    })
  })

  it('preserves order across several sends', async() => {
    const client = await connectedClient()

    client.send('message', 'one')
    client.send('message', 'two')
    client.send('message', 'three')
    await flush()

    expect(stub!.received.map(f => JSON.parse(f.data!).message)).toEqual([
      'one',
      'two',
      'three'
    ])
  })
})

describe('SocketClient incoming events', () => {
  it('emits the event named in the frame', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.send('message', { userName: 'alice', message: 'hi' })
    await flush()

    expect(seen).toEqual([{ userName: 'alice', message: 'hi' }])
  })

  it('emits updateUsers with the roster', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('updateUsers', payload => seen.push(payload))

    stub!.send('updateUsers', [{ id: '1', userName: 'alice' }])
    await flush()

    expect(seen).toEqual([[{ id: '1', userName: 'alice' }]])
  })

  it('splits newline-delimited frames into separate events', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.push(
      serverTextFrame(
        '{"event":"message","message":"one"}\n{"event":"message","message":"two"}'
      )
    )
    await flush()

    expect(seen).toEqual(['one', 'two'])
  })

  it('handles two frames arriving in one chunk', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.push(
      Buffer.concat([
        serverTextFrame('{"event":"message","message":"one"}'),
        serverTextFrame('{"event":"message","message":"two"}')
      ])
    )
    await flush()

    expect(seen).toEqual(['one', 'two'])
  })

  it('reassembles a frame split across chunks', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    const frame = serverTextFrame('{"event":"message","message":"split"}')
    stub!.push(frame.subarray(0, 10))
    await flush()
    stub!.push(frame.subarray(10))
    await flush()

    expect(seen).toEqual(['split'])
  })

  it('ignores a malformed JSON line without dropping the connection', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.push(serverTextFrame('not json at all'))
    stub!.send('message', 'still here')
    await flush()

    expect(seen).toEqual(['still here'])
  })

  it('ignores empty lines between frames', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.push(serverTextFrame('\n\n{"event":"message","message":"kept"}\n\n'))
    await flush()

    expect(seen).toEqual(['kept'])
  })

  it('does not emit for an event nobody listens to', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.send('somethingElse', 'ignored')
    await flush()

    expect(seen).toEqual([])
  })
})

describe('SocketClient control frames', () => {
  it('answers a ping with a pong carrying the same payload', async() => {
    await connectedClient()

    stub!.push(serverControlFrame(9, Buffer.from('keepalive')))
    await flush()

    // `WebSocketFrameDecoder` does not surface pong (opcode 10), so read the
    // reply straight off the wire.
    const reply = Buffer.concat(stub!.rawReceived)
    expect(reply[0]! & 0x0f).toBe(10)
    expect(unmaskControlPayload(reply)).toBe('keepalive')
  })

  it('echoes a close frame and hangs up', async() => {
    await connectedClient()

    stub!.push(serverControlFrame(8))
    await flush()

    expect(stub!.received).toEqual([{ type: 'close' }])
    expect(Buffer.concat(stub!.rawReceived)[0]! & 0x0f).toBe(8)
  })

  it('keeps dispatching messages after a ping', async() => {
    const client = await connectedClient()
    const seen: unknown[] = []
    client.on('message', payload => seen.push(payload))

    stub!.push(serverControlFrame(9, Buffer.from('ping')))
    stub!.send('message', 'after ping')
    await flush()

    expect(seen).toEqual(['after ping'])
  })
})
