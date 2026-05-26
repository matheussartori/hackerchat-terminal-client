import EventEmitter from 'events'
import { AppEvents } from '../events/app-events'
import { ComponentBuilder } from './component-builder'
import { UserColorService } from './user-color-service'
import type { BuiltComponents, ChatMessage } from '../types'
import type { Widgets } from 'blessed'

export class TerminalController {
  private readonly colorService = new UserColorService()

  async initialize(eventEmitter: EventEmitter): Promise<void> {
    const components = new ComponentBuilder()
      .setScreen({ title: 'hackerchat - Redstone Solutions' })
      .setLayout()
      .setInput(this.onInputReceived(eventEmitter))
      .setChat()
      .setStatus()
      .setActivityLog()
      .build()

    this.registerEventHandlers(eventEmitter, components)
    components.input.focus()
    components.screen.render()
  }

  private onInputReceived(emitter: EventEmitter): (this: Widgets.TextareaElement) => void {
    return function(this: Widgets.TextareaElement) {
      const message = this.getValue()
      emitter.emit(AppEvents.MESSAGE_SENT, message)
      this.clearValue()
    }
  }

  private onMessageReceived(components: BuiltComponents): (msg: ChatMessage) => void {
    return msg => {
      const { userName, message } = msg
      const color = this.colorService.getColor(userName)
      components.chat.addItem(`{${color}}{bold}${userName}{/}: ${message}`)
      components.chat.setScrollPerc(100)
      components.screen.render()
    }
  }

  private onActivityLogUpdated(components: BuiltComponents): (msg: string) => void {
    return msg => {
      const [userName] = msg.split(/\s/)
      const color = this.colorService.getColor(userName)
      components.activityLog.addItem(`{${color}}{bold}${msg}{/}`)
      components.screen.render()
    }
  }

  private onStatusUpdated(components: BuiltComponents): (users: string[]) => void {
    return users => {
      const items = [
        '{bold}Users on room{/}',
        ...users.map(userName => {
          const color = this.colorService.getColor(userName)
          return `{${color}}{bold}${userName}{/}`
        })
      ]
      components.status.setItems(items)
      components.screen.render()
    }
  }

  private registerEventHandlers(emitter: EventEmitter, components: BuiltComponents): void {
    emitter.on(AppEvents.MESSAGE_RECEIVED, this.onMessageReceived(components))
    emitter.on(AppEvents.ACTIVITYLOG_UPDATED, this.onActivityLogUpdated(components))
    emitter.on(AppEvents.STATUS_UPDATED, this.onStatusUpdated(components))
  }
}
