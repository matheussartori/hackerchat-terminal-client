import { Widgets} from 'blessed'

export type BaseComponent = {
  border: string
  mouse: boolean
  keys: boolean
  top: number
  scrollbar: {
    ch: string
  }
  tags: boolean
}

export type Screen = {
  title: string
}

export type Component = {
  screen: Widgets.Screen | undefined
  layout: Widgets.LayoutElement | undefined
  input: Widgets.InputElement | undefined
  chat: Widgets.ListOptions<Widgets.ListElementStyle> | undefined
  status: Widgets.ListOptions<Widgets.ListElementStyle> | undefined
  activityLog: Widgets.ListOptions<Widgets.ListElementStyle> | undefined
}
