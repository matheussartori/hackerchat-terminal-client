import blessed, { Widgets } from 'blessed'
import * as Types from './@types/ComponentTypes'

export default class ComponentBuilder {
  public screen!: Widgets.Screen
  public layout!: Widgets.LayoutElement
  public input!: Widgets.InputElement
  public chat!: Widgets.ListOptions<Widgets.ListElementStyle>
  public status!: Widgets.ListOptions<Widgets.ListElementStyle>
  public activityLog!: Widgets.ListOptions<Widgets.ListElementStyle>

  /**
   * Returns the baseComponent, used on many others to bootstrap.
   *
   * @returns {Types.BaseComponent}
   */
  private baseComponent(): Types.BaseComponent {
    return {
      border: 'line',
      mouse: true,
      keys: true,
      top: 0,
      scrollbar: {
        ch: ' '
      },
      tags: true
    }
  }

  /**
   * Set the screen component.
   * 
   * @param {{title: string}} params 
   * @returns 
   */
  setScreen({ title }: Types.Screen): ComponentBuilder {
    this.screen = blessed.screen({
      smartCSR: true,
      title,
      autoPadding: true
    })

    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0))

    return this
  }

  /**
   * Set the layout component.
   * 
   * @returns {ComponentBuilder} this
   */
  setLayoutComponent(): ComponentBuilder {
    this.layout = blessed.layout({
      parent: this.screen,
      layout: 'inline',
      width: '100%',
      height: '100%'
    })

    return this
  }

  /**
   * Set the textarea component.
   * 
   * @param {() => void} onEnterPressed 
   * @returns {ComponentBuilder} this
   */
  setInputComponent(onEnterPressed: () => void): ComponentBuilder {
    const input = blessed.textarea({
      parent: this.screen,
      bottom: 0,
      height: '10%',
      inputOnFocus: true,
      padding: {
        top: 1,
        left: 2
      },
      style: {
        fg: '#f6f6f6',
        bg: '#353535'
      }
    })

    input.key('enter', onEnterPressed)
    this.input = input

    return this
  }

  /**
   * Set the chat history component.
   * 
   * @returns {ComponentBuilder} this
   */
  setChatComponent(): ComponentBuilder {
    // @ts-ignore -- Ignoring the baseComponent attributes who doesn't exists on blessed.list.
    this.chat = blessed.list({
      ...this.baseComponent(),
      parent: this.layout,
      align: 'left',
      width: '50%',
      height: '90%',
      items: ['{bold}Messenger{/}']
    })

    return this
  }

  /**
   * Set the status component (users on room).
   * 
   * @returns {ComponentBuilder} this
   */
  setStatusComponent(): ComponentBuilder {
    // @ts-ignore -- Ignoring the baseComponent attributes who doesn't exists on blessed.list.
    this.status = blessed.list({
      ...this.baseComponent(),
      parent: this.layout,
      width: '25%',
      height: '90%',
      items: ['{bold}Users on room{/}']
    })

    return this
  }

  /**
   * Set the activity log component (users that joined and exited).
   * 
   * @returns {ComponentBuilder} this
   */
  setActivityLogComponent(): ComponentBuilder {
    // @ts-ignore -- Ignoring the baseComponent attributes who doesn't exists on blessed.list.
    this.activityLog = blessed.list({
      ...this.baseComponent(),
      parent: this.layout,
      width: '25%',
      height: '90%',
      items: ['{bold}Activity log{/}']
    })

    return this
  }

  /**
   * Build and return all rendered components.
   * 
   * @returns {Types.Component} components
   */
  build(): Types.Component  {
    const components = {
      screen: this.screen,
      input: this.input,
      chat: this.chat,
      status: this.status,
      activityLog: this.activityLog
    }

    return components
  }
}