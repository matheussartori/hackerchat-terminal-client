import Event from 'events'
import * as Types from './@types/SocketTypes'
import http from 'http'
import { randomBytes } from 'crypto'

export default class SocketClient {
  private serverConnection!: NodeJS.Socket
  private serverListener = new Event()
  private receiveBuffer = Buffer.alloc(0)
  public host: string
  public port: string | null
  public protocol: string

  /**
   * SocketClient constructor.
   *
   * @param {Types.Socket} socket
   */
  constructor({ hostUri, port, protocol }: Types.Socket) {
    this.host = hostUri
    this.port = port
    this.protocol = protocol
  }

  private encodeFrame(data: string): Buffer {
    const payload = Buffer.from(data, 'utf8')
    const len = payload.length

    let headerLength = 6 // 2 header bytes + 4 masking key bytes
    if (len > 65535) headerLength += 8
    else if (len > 125) headerLength += 2

    const frame = Buffer.allocUnsafe(headerLength + len)
    frame[0] = 0x81 // FIN=1, opcode=1 (text)

    if (len > 65535) {
      frame[1] = 0xFF
      frame.writeBigUInt64BE(BigInt(len), 2)
    } else if (len > 125) {
      frame[1] = 0xFE
      frame.writeUInt16BE(len, 2)
    } else {
      frame[1] = 0x80 | len
    }

    const maskOffset = headerLength - 4
    const mask = randomBytes(4)
    mask.copy(frame, maskOffset)

    for (let i = 0; i < len; i++) {
      frame[headerLength + i] = payload[i] ^ mask[i % 4]
    }

    return frame
  }

  private encodeControlFrame(opcode: number, payload: Buffer = Buffer.alloc(0)): Buffer {
    const len = payload.length
    const frame = Buffer.allocUnsafe(6 + len)
    frame[0] = 0x80 | opcode
    frame[1] = 0x80 | len
    const mask = randomBytes(4)
    mask.copy(frame, 2)
    for (let i = 0; i < len; i++) {
      frame[6 + i] = payload[i] ^ mask[i % 4]
    }
    return frame
  }

  private decodeFrames(data: Buffer): string[] {
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, data])
    const messages: string[] = []

    while (this.receiveBuffer.length >= 2) {
      const byte1 = this.receiveBuffer[0]
      const byte2 = this.receiveBuffer[1]
      const opcode = byte1 & 0x0f
      const masked = (byte2 & 0x80) !== 0
      let payloadLen = byte2 & 0x7f
      let headerLen = 2 + (masked ? 4 : 0)

      if (payloadLen === 126) {
        if (this.receiveBuffer.length < 4) break
        payloadLen = this.receiveBuffer.readUInt16BE(2)
        headerLen += 2
      } else if (payloadLen === 127) {
        if (this.receiveBuffer.length < 10) break
        payloadLen = Number(this.receiveBuffer.readBigUInt64BE(2))
        headerLen += 8
      }

      if (this.receiveBuffer.length < headerLen + payloadLen) break

      if (opcode === 8) { // close
        const closePayload = this.receiveBuffer.subarray(headerLen, headerLen + payloadLen)
        this.serverConnection.write(this.encodeControlFrame(8, closePayload))
        this.serverConnection.end()
      } else if (opcode === 9) { // ping — must respond with pong
        const pingPayload = this.receiveBuffer.subarray(headerLen, headerLen + payloadLen)
        this.serverConnection.write(this.encodeControlFrame(10, pingPayload))
      } else if (opcode === 1 || opcode === 0) { // text or continuation
        const payloadStart = headerLen
        let payload: Buffer
        if (masked) {
          const mask = this.receiveBuffer.subarray(headerLen - 4, headerLen)
          payload = Buffer.allocUnsafe(payloadLen)
          for (let i = 0; i < payloadLen; i++) {
            payload[i] = this.receiveBuffer[payloadStart + i] ^ mask[i % 4]
          }
        } else {
          payload = this.receiveBuffer.subarray(payloadStart, payloadStart + payloadLen)
        }
        messages.push(payload.toString('utf8'))
      }

      this.receiveBuffer = this.receiveBuffer.subarray(headerLen + payloadLen)
    }

    return messages
  }

  /**
   * Send a message to the socket server.
   *
   * @param {string} event
   * @param {Types.Join} message
   * @returns {void}
   */
  sendMessage(event: string, message: Types.Join): void {
    this.serverConnection.write(this.encodeFrame(JSON.stringify({ event, message })))
  }

  /**
   * Attach the events based on the function name.
   * Calls the function dynamically, the name of the event equals the name of the function.
   *
   * @param {Event} events
   * @returns {void}
   */
  attachEvents(events: Event): void {
    this.serverConnection.on('data', data => {
      try {
        const messages = this.decodeFrames(data as Buffer)
        messages
          .flatMap((msg: string) => msg.split('\n').filter(Boolean))
          .map((line: string) => JSON.parse(line))
          .forEach(({ event, message }: Types.Message) => {
            this.serverListener.emit(event, message)
          })
      } catch (_error) {
        // suppress: malformed frame, ignore silently
      }
    })

    this.serverConnection.on('end', () => {
      // suppress: writing to stdout here would corrupt the blessed terminal
    })

    this.serverConnection.on('error', _error => {
      // suppress: writing to stdout here would corrupt the blessed terminal
    })

    // @ts-ignore
    for (const [key, value] of events) {
      this.serverListener.on(key, value)
    }
  }

  /**
   * Create the socket connection (client side).
   *
   * @returns {Promise<NodeJS.Socket>} socket
   */
  async createConnection(): Promise<NodeJS.Socket> {
    const wsKey = randomBytes(16).toString('base64')
    const options = {
      port: this.port,
      host: this.host,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': wsKey,
        'Sec-WebSocket-Version': '13'
      }
    }

    const http = await import(this.protocol)
    const request = http.request(options)
    request.end()

    return new Promise(resolve => {
      request.once('upgrade', (_response: http.IncomingMessage, socket: NodeJS.Socket) => resolve(socket))
    })
  }

  /**
   * Entry point for start the socket client.
   *
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    this.serverConnection = await this.createConnection()
  }
}
