export type Socket = {
  hostUri: string
  port: string | null
  protocol: string
}

export type Message = {
  event: string | symbol
  message: string
}

export type Join = {
  roomId: string
  userName: string
}