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
   * @param {Types.EventManagerType} eventManagerType
   */
  constructor({ componentEmitter, socketClient }: Types.EventManagerType) {
    this.componentEmitter = componentEmitter
    this.socketClient = socketClient
  }

  /**
   * Join the room and listen for new messages.
   *
   * @param {Types.Join} data
   * @returns {void}
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
   * @param {Map<string, Types.User>} users
   * @returns {void}
   */
  updateUsers(users: Map<string, Types.User>): void {
    const connectedUsers = users
    connectedUsers.forEach(({ id, userName }) => this.allUsers.set(id, userName))
    this.updateUsersComponent()
  }

  /**
   * Disconnect the user from a room.
   *
   * @param {Types.User} user
   * @returns {void}
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
   * @returns {void}
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
   * @param {Types.User} user
   * @returns {void}
   */
  newUserConnected(user: Types.User): void {
    this.allUsers.set(user.id, user.userName)
    this.updateUsersComponent()
    this.updateActivityLogComponent(`${user.userName} joined!`)
  }

  /**
   * Emit for update the activity log component.
   *
   * @param {string} message
   * @returns {void}
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
   * @returns {void}
   */
  private emitComponentUpdate(event: string, message: string): void {
    this.componentEmitter.emit(
      event,
      message
    )
  }

  /**
   * Update all users on the component side.
   *
   * @returns {void}
   */
  private updateUsersComponent(): void {
    this.emitComponentUpdate(
      EventTypes.events.app.STATUS_UPDATED,
      // @ts-ignore
      Array.from(this.allUsers.values())
    )
  }

  /**
   * Get all the class functions and return with Map.
   *
   * @returns {Map<string, string>} functions
   */
  getEvents(): Map<string, string> {
    const functions = Reflect.ownKeys(EventManager.prototype)
      .filter(fn => fn !== 'constructor')
      // @ts-ignore
      .map(name => [name, this[name].bind(this)])

    // @ts-ignore
    return new Map(functions)
  }
}