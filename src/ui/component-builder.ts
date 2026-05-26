import blessed from 'blessed'
import type { BaseComponentOptions, BuiltComponents } from '../types'

export class ComponentBuilder {
  private screen!: blessed.Widgets.Screen
  private input!: blessed.Widgets.TextareaElement
  private chat!: blessed.Widgets.ListElement
  private status!: blessed.Widgets.ListElement
  private activityLog!: blessed.Widgets.ListElement
  private layout!: blessed.Widgets.LayoutElement

  private baseOptions(): BaseComponentOptions {
    return {
      border: 'line',
      mouse: true,
      keys: true,
      top: 0,
      scrollbar: { ch: ' ' },
      tags: true
    }
  }

  setScreen({ title }: { title: string }): this {
    this.screen = blessed.screen({ smartCSR: true, title })
    this.screen.key(['C-c'], () => process.exit(0))
    return this
  }

  setLayout(): this {
    this.layout = blessed.layout({
      parent: this.screen,
      layout: 'inline',
      width: '100%',
      height: '90%'
    })
    return this
  }

  setInput(onEnterPressed: () => void): this {
    this.input = blessed.textarea({
      parent: this.screen,
      bottom: 0,
      height: '10%',
      inputOnFocus: true,
      padding: { top: 1, left: 2 },
      style: { fg: '#f6f6f6', bg: '#353535' }
    })
    this.input.key('enter', onEnterPressed)
    return this
  }

  setChat(): this {
    this.chat = blessed.list({
      ...this.baseOptions(),
      parent: this.layout,
      align: 'left',
      width: '50%',
      height: '100%',
      items: ['{bold}Messenger{/}']
    } as blessed.Widgets.ListOptions<blessed.Widgets.ListElementStyle>)
    return this
  }

  setStatus(): this {
    this.status = blessed.list({
      ...this.baseOptions(),
      parent: this.layout,
      width: '25%',
      height: '100%',
      items: ['{bold}Users on room{/}']
    } as blessed.Widgets.ListOptions<blessed.Widgets.ListElementStyle>)
    return this
  }

  setActivityLog(): this {
    this.activityLog = blessed.list({
      ...this.baseOptions(),
      parent: this.layout,
      width: '25%',
      height: '100%',
      items: ['{bold}Activity log{/}']
    } as blessed.Widgets.ListOptions<blessed.Widgets.ListElementStyle>)
    return this
  }

  build(): BuiltComponents {
    return {
      screen: this.screen,
      input: this.input,
      chat: this.chat,
      status: this.status,
      activityLog: this.activityLog
    }
  }
}
