export const AppEvents = {
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  ACTIVITYLOG_UPDATED: 'activityLog:updated',
  STATUS_UPDATED: 'status:updated'
} as const

export const SocketEvents = {
  JOIN_ROOM: 'joinRoom',
  MESSAGE: 'message'
} as const
