import EventEmitter from 'events'
import ComponentBuilder from './ComponentBuilder'
import { EventTypes } from './EventTypes'
import * as Types from './@types/TerminalTypes'

export default class TerminalController {
  private usersColors = new Map()

  /**
   * TerminalController constructor.
   */
  constructor() {}

  /**
   * Generates a random hex color. Used for painting the nicknames.
   *
   * @returns {string} color
   */
  private pickColor(): string {
    return '#' + ((1 << 24) * Math.random() | 0).toString(16) + '-fg'
  }

  /**
   * Verifies if the username already have a color. If false, generates a new color and saves on #usersColor map.
   *
   * @param {string} userName 
   * @returns {string} color
   */
  private getUserColor(userName: string): string {
    if (this.usersColors.has(userName)) return this.usersColors.get(userName)

    const color = this.pickColor()
    this.usersColors.set(userName, color)

    return color
  }

  /**
   * Event dispatched on message sent.
   *
   * @param {EventEmitter} eventEmitter 
   * @returns {() => void} void
   */
  private onInputReceived(eventEmitter: EventEmitter): () => void {
    return function () {
      // @ts-ignore
      const message = this.getValue()
      eventEmitter.emit(EventTypes.events.app.MESSAGE_SENT, message)
      // @ts-ignore
      this.clearValue()
    }
  }

  /**
   * On message received handler.
   *
   * @param {Types.MessageReceived} params
   * @returns {(msg: Types.Message) => void} mesage
   */
  private onMessageReceived({ screen, chat }: Types.MessageReceived): (msg: Types.Message) => void {
    return msg => {
      const { userName, message } = msg
      const color = this.getUserColor(userName)
      chat.addItem(`{${color}}{bold}${userName}{/}: ${message}`)
      chat.setScrollPerc(100)
      screen.render()
    }
  }

  /**
   * On log changed handler.
   *
   * @param {Types.LogChanged} params 
   * @returns {(msg: string) => void} void
   */
  private onLogChanged({ screen, activityLog }: Types.LogChanged): (msg: string) => void {
    return (msg: string) => {
      const [userName] = msg.split('/\s/')
      const color = this.getUserColor(userName)
      activityLog.addItem(`{${color}}{bold}${msg.toString()}{/}`)

      screen.render()
    }
  }

  /**
   * On status changed handler.
   *
   * @param {Types.StatusChanged} params 
   * @returns {users: []) => void} void
   */
  private onStatusChanged({ screen, status }: Types.StatusChanged): (users: []) => void {
    return (users: []) => {
      // @ts-ignore
      const { content } = status.items.shift()
      status.clearItems()
      status.addItem(content)

      users.forEach(userName => {
        const color = this.getUserColor(userName)
        status.addItem(`{${color}}{bold}${userName}{/}`)
      })

      screen.render()
    }
  }

  /**
   * Register the events.
   *
   * @param {EventEmitter} eventEmitter 
   * @param {ComponentsBuilder} components 
   */
  private registerEvents(eventEmitter: EventEmitter, components: ComponentBuilder) {
    // @ts-ignore
    eventEmitter.on(EventTypes.events.app.MESSAGE_RECEIVED, this.onMessageReceived(components))
    // @ts-ignore
    eventEmitter.on(EventTypes.events.app.ACTIVITYLOG_UPDATED, this.onLogChanged(components))
    // @ts-ignore
    eventEmitter.on(EventTypes.events.app.STATUS_UPDATED, this.onStatusChanged(components))
  }

  /**
   * Initialize the hacker chat.
   *
   * @param {EventEmitter} eventEmitter 
   */
  async initializeTable(eventEmitter: EventEmitter) {
    const components = new ComponentBuilder()
      .setScreen({ title: 'HackerChat - Matheus Sartori' })
      .setLayoutComponent()
      .setInputComponent(this.onInputReceived(eventEmitter))
      .setChatComponent()
      .setStatusComponent()
      .setActivityLogComponent()
      .build()

    // @ts-ignore
    this.registerEvents(eventEmitter, components)
    // @ts-ignore
    components.input.focus()
    // @ts-ignore
    components.screen.render()
  }
}