export type SocketMessage = {
  event: string
  message: unknown
}

export type JoinPayload = {
  roomId: string
  userName: string
}

export type User = {
  id: string
  userName: string
}

export type ChatMessage = {
  userName: string
  message: string
}
