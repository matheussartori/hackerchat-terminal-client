import { EventTypes } from './EventTypes'
import * as Types from './@types/EventTypes'
import EventEmitter from 'node:events'
import SocketClient from './SocketClient'

export default class EventManager {
  private allUsers = new Map()
  public componentEmitter: EventEmitter
  public socketClient: SocketClient

  /**
   * EventManager constructor.
   *
   * @param {{ componentEmitter: object, socketClient: object}} params
   */
  constructor({ componentEmitter, socketClient }: Types.EventManagerType) {
    this.componentEmitter = componentEmitter
    this.socketClient = socketClient
  }

  /**
   * Join the room and listen for new messages.
   *
   * @param {string} data 
   */
  joinRoomWaitMessages(data: Types.Join): void {
    this.socketClient.sendMessage(EventTypes.events.socket.JOIN_ROOM, data)

    this.componentEmitter.on(EventTypes.events.app.MESSAGE_SENT, msg => {
      this.socketClient.sendMessage(EventTypes.events.socket.MESSAGE, msg)
    })
  }

  /**
   * Updates the connected users.
   *
   * @param {Map} users 
   */
  updateUsers(users: []): void {
    const connectedUsers = users
    connectedUsers.forEach(({ id, userName }) => this.allUsers.set(id, userName))
    this.updateUsersComponent()
  }

  /**
   * Disconnect the user from a room.
   *
   * @param {Map} user 
   */
  disconnectUser(user: Types.User): void {
    const { userName, id } = user
    this.allUsers.delete(id)

    this.updateActivityLogComponent(`${userName} left!`)
    this.updateUsersComponent()
  }

  /**
   * Emit the message received event.
   *
   * @param {string} message 
   */
  message(message: string): void {
    this.emitComponentUpdate(
      EventTypes.events.app.MESSAGE_RECEIVED,
      message
    )
  }

  /**
   * Handle the upcoming connected users.
   *
   * @param {object} message 
   */
  newUserConnected(message: Types.User): void {
    const user = message
    this.allUsers.set(user.id, user.userName)
    this.updateUsersComponent()
    this.updateActivityLogComponent(`${user.userName} joined!`)
  }

  /**
   * Emit for update the activity log component.
   *
   * @param {string} message 
   */
  private updateActivityLogComponent(message: string): void {
    this.emitComponentUpdate(
      EventTypes.events.app.ACTIVITYLOG_UPDATED,
      message
    )
  }

  /**
   * Emit the events to the componentEmitter.
   * 
   * @param {string} event 
   * @param {string} message 
   */
  private emitComponentUpdate(event: string, message: string): void {
    this.componentEmitter.emit(
      event,
      message
    )
  }

  /**
   * Update all users on the component side.
   */
  private updateUsersComponent() {
    this.emitComponentUpdate(
      EventTypes.events.app.STATUS_UPDATED,
      // @ts-ignore
      Array.from(this.allUsers.values())
    )
  }

  /**
   * Get all the class functions and return with Map.
   *
   * @returns {Map} functions
   */
  getEvents() {
    const functions = Reflect.ownKeys(EventManager.prototype)
      .filter(fn => fn !== 'constructor')
      // @ts-ignore
      .map(name => [name, this[name].bind(this)])

    // @ts-ignore
    return new Map(functions)
  }
}