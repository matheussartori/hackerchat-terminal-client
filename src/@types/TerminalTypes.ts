import { Widgets } from 'blessed'

export type MessageReceived = {
  screen: Widgets.Screen
  chat: Widgets.ListOptions<Widgets.ListElementStyle>
}

export type Message = {
  userName: string
  message: string
}

export type LogChanged = {
  screen: Widgets.Screen
  activityLog: Widgets.ListOptions<Widgets.ListElementStyle>
}

export type StatusChanged = {
  screen: Widgets.Screen
  status: Widgets.ListOptions<Widgets.ListElementStyle>
}