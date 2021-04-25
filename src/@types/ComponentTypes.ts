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
  screen: Widgets.Screen
  layout?: Widgets.LayoutElement
  input: Widgets.InputElement
  chat: Widgets.ListOptions<Widgets.ListElementStyle>
  status: Widgets.ListOptions<Widgets.ListElementStyle>
  activityLog: Widgets.ListOptions<Widgets.ListElementStyle>
}
