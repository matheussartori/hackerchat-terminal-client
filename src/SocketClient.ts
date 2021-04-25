import Event from 'events'
import * as Types from './@types/SocketTypes'
import http from 'http'

export default class SocketClient {
  private serverConnection!: NodeJS.Socket
  private serverListener = new Event()
  public host: string
  public port: string | null
  public protocol: string

  /**
   * SocketClient constructor.
   *
   * @param {{hostUri: string, port: number, protocol: 'http' | 'https'}} param0 
   */
  constructor({ hostUri, port, protocol }: Types.Socket) {
    this.host = hostUri
    this.port = port
    this.protocol = protocol
  }

  /**
   * Send a message to the socket server.
   *
   * @param {string} event 
   * @param {Types.Join} message 
   */
  sendMessage(event: string, message: Types.Join): void {
    this.serverConnection.write(JSON.stringify({ event, message }))
  }

  /**
   * Attach the events based on the function name.
   * Calls the function dynamically, the name of the event equals the name of the function.
   * 
   * @param {Event} events
   */
  attachEvents(events: Event): void {
    this.serverConnection.on('data', data => {
      try {
        data.toString()
          .split('\n')
          .filter((line: string) => !!line)
          .map(JSON.parse)
          .map(({ event, message }: Types.Message) => {
            this.serverListener.emit(event, message)
          })
      } catch (error) {
        console.log('Invalid!', data.toString(), error)
      }
    })

    this.serverConnection.on('end', () => {
      console.log('I disconnected!')
    })

    this.serverConnection.on('error', error => {
      console.error('Error:', error)
    })

    // @ts-ignore
    for (const [key, value] of events) {
      this.serverListener.on(key, value)
    }
  }

  /**
   * Create the socket connection (client side).
   *
   * @returns {Promise} upgrade
   */
  async createConnection(): Promise<NodeJS.Socket> {
    const options = {
      port: this.port,
      host: this.host,
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket'
      }
    }

    const http = await import(this.protocol)
    const request = http.request(options)
    request.end()

    return new Promise(resolve => {
      request.once('upgrade', (response: http.IncomingMessage , socket: NodeJS.Socket) => resolve(socket))
    })
  }

  /**
   * Entry point for start the socket client.
   */
  async initialize(): Promise<void> {
    this.serverConnection = await this.createConnection()
    console.log('I connected to the server!')
  }
}