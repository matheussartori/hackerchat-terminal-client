import { EventEmitter } from 'events'
import http from 'http'
import { randomBytes } from 'crypto'
import type { ServerConfig, SocketMessage } from '../types/index.js'
import { encodeTextFrame, encodeControlFrame, WebSocketFrameDecoder } from './web-socket-frame.js'

export class SocketClient extends EventEmitter {
  private socket!: NodeJS.Socket
  private readonly frameDecoder = new WebSocketFrameDecoder()

  constructor(private readonly config: ServerConfig) {
    super()
  }

  async connect(): Promise<void> {
    this.socket = await this.createConnection()
    this.bindSocketEvents()
  }

  send(event: string, payload: unknown): void {
    this.socket.write(encodeTextFrame(JSON.stringify({ event, message: payload })))
  }

  private bindSocketEvents(): void {
    this.socket.on('data', (data: Buffer) => {
      try {
        const frames = this.frameDecoder.decode(data)
        for (const frame of frames) {
          if (frame.type === 'ping') {
            this.socket.write(encodeControlFrame(10, frame.payload))
          } else if (frame.type === 'close') {
            this.socket.write(encodeControlFrame(8, frame.payload))
            this.socket.end()
          } else {
            this.parseAndDispatch(frame.data)
          }
        }
      } catch {
        // suppress: malformed frame
      }
    })

    // suppress both: writing to stdout corrupts the blessed terminal
    this.socket.on('end', () => {})
    this.socket.on('error', () => {})
  }

  private parseAndDispatch(raw: string): void {
    raw.split('\n').filter(Boolean).forEach(line => {
      try {
        const { event, message } = JSON.parse(line) as SocketMessage
        this.emit(event, message)
      } catch {
        // suppress: malformed JSON
      }
    })
  }

  private async createConnection(): Promise<NodeJS.Socket> {
    const wsKey = randomBytes(16).toString('base64')
    const options = {
      port: this.config.port || undefined,
      host: this.config.hostUri,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Key': wsKey,
        'Sec-WebSocket-Version': '13'
      }
    }

    const httpModule = await import(this.config.protocol)
    const request = httpModule.request(options)
    request.end()

    return new Promise(resolve => {
      request.once('upgrade', (_response: http.IncomingMessage, socket: NodeJS.Socket) => resolve(socket))
    })
  }
}
