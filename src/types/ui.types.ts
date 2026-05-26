import type { Widgets } from 'blessed'

export type BaseComponentOptions = {
  border: string
  mouse: boolean
  keys: boolean
  top: number
  scrollbar: { ch: string }
  tags: boolean
}

export type BuiltComponents = {
  screen: Widgets.Screen
  input: Widgets.TextareaElement
  chat: Widgets.ListElement
  status: Widgets.ListElement
  activityLog: Widgets.ListElement
}
