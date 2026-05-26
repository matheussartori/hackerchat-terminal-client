import type { ChatMessage } from './network.types.js'

export type ChatEntry = ChatMessage & {
  id: number
  timestamp: Date
  self?: boolean
}

export type ActivityEntry = {
  id: number
  userName: string
  action: 'joined' | 'left'
  timestamp: Date
}
