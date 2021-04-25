import EventEmitter from 'events'
import SocketClient from '../SocketClient'

export type EventManagerType = {
  componentEmitter: EventEmitter
  socketClient: SocketClient
}

export type User = {
  userName: string
  id: string
}

export type Join = {
  roomId: string
  userName: string
}