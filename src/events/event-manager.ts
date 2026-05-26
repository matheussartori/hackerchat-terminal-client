import EventEmitter from 'events'
import { AppEvents, SocketEvents } from './app-events'
import { UserStore } from '../state/user-store'
import type { SocketClient } from '../network/socket-client'
import type { ChatMessage, JoinPayload, User } from '../types'

export class EventManager {
  private readonly userStore = new UserStore()

  constructor(
    private readonly componentEmitter: EventEmitter,
    private readonly socketClient: SocketClient
  ) {}

  joinRoom(data: JoinPayload): void {
    this.socketClient.send(SocketEvents.JOIN_ROOM, data)

    this.componentEmitter.on(AppEvents.MESSAGE_SENT, (msg: string) => {
      this.socketClient.send(SocketEvents.MESSAGE, msg)
    })
  }

  registerSocketHandlers(): void {
    this.socketClient.on('updateUsers', (users: User[]) => this.onUpdateUsers(users))
    this.socketClient.on('disconnectUser', (user: User) => this.onDisconnectUser(user))
    this.socketClient.on('newUserConnected', (user: User) => this.onNewUserConnected(user))
    this.socketClient.on('message', (message: ChatMessage) => this.onMessage(message))
  }

  private onUpdateUsers(users: User[]): void {
    this.userStore.updateAll(users)
    this.emitStatusUpdate()
  }

  private onDisconnectUser(user: User): void {
    this.userStore.remove(user.id)
    this.componentEmitter.emit(AppEvents.ACTIVITYLOG_UPDATED, `${user.userName} left!`)
    this.emitStatusUpdate()
  }

  private onNewUserConnected(user: User): void {
    this.userStore.add(user)
    this.emitStatusUpdate()
    this.componentEmitter.emit(AppEvents.ACTIVITYLOG_UPDATED, `${user.userName} joined!`)
  }

  private onMessage(message: ChatMessage): void {
    this.componentEmitter.emit(AppEvents.MESSAGE_RECEIVED, message)
  }

  private emitStatusUpdate(): void {
    this.componentEmitter.emit(AppEvents.STATUS_UPDATED, this.userStore.getNames())
  }
}
