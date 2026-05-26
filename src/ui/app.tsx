import { Box, useApp, useInput, useStdout } from 'ink'
import { useEffect, useMemo, useRef, useState } from 'react'
import type EventEmitter from 'events'
import { AppEvents } from '../events/app-events.js'
import { UserColorService } from './user-color-service.js'
import { Header } from './components/header.js'
import { Sidebar } from './components/sidebar.js'
import { Messages } from './components/messages.js'
import { InputBar } from './components/input-bar.js'
import type { ActivityEntry, ChatEntry } from '../types/ui.types.js'
import type { ChatMessage } from '../types/network.types.js'

const HEADER_H = 3
const INPUT_H = 4
const SIDEBAR_W = 28
const MIN_COLS = 60
const MIN_ROWS = 12

type AppProps = {
  emitter: EventEmitter
  userName: string
  room: string
}

export function App({ emitter, userName, room }: AppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const colorService = useMemo(() => new UserColorService(), [])

  const [cols, setCols] = useState(Math.max(MIN_COLS, stdout.columns ?? MIN_COLS))
  const [rows, setRows] = useState(Math.max(MIN_ROWS, (stdout.rows ?? MIN_ROWS) - 1))

  const [messages, setMessages] = useState<ChatEntry[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [scrollOffset, setScrollOffset] = useState(0)
  const prevMessageCount = useRef(0)

  const bodyH = Math.max(3, rows - HEADER_H - INPUT_H)
  const messagesVisible = Math.max(1, bodyH - 3)

  useEffect(() => {
    const onResize = () => {
      setCols(Math.max(MIN_COLS, stdout.columns ?? MIN_COLS))
      setRows(Math.max(MIN_ROWS, (stdout.rows ?? MIN_ROWS) - 1))
      setScrollOffset(0)
    }
    stdout.on('resize', onResize)
    return () => { stdout.off('resize', onResize) }
  }, [stdout])

  useEffect(() => {
    const delta = messages.length - prevMessageCount.current
    prevMessageCount.current = messages.length
    if (delta > 0) {
      setScrollOffset(s => (s > 0 ? s + delta : 0))
    }
  }, [messages.length])

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      exit()
      return
    }
    if (key.pageUp) {
      setScrollOffset(s => Math.min(Math.max(0, messages.length - messagesVisible), s + messagesVisible))
      return
    }
    if (key.pageDown) {
      setScrollOffset(s => Math.max(0, s - messagesVisible))
      return
    }
    if (key.ctrl && input === 'u') {
      setScrollOffset(s => Math.min(Math.max(0, messages.length - messagesVisible), s + 1))
      return
    }
    if (key.ctrl && input === 'd') {
      setScrollOffset(s => Math.max(0, s - 1))
      return
    }
    if (key.home) {
      setScrollOffset(Math.max(0, messages.length - messagesVisible))
      return
    }
    if (key.end) {
      setScrollOffset(0)
    }
  })

  useEffect(() => {
    let counter = 0
    const nextId = () => ++counter

    const onMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, {
        ...msg,
        id: nextId(),
        timestamp: new Date(),
        self: msg.userName === userName
      }])
    }

    const onActivity = (text: string) => {
      const [name, ...rest] = text.split(/\s+/)
      const verb = rest.join(' ').replace('!', '').trim()
      const action: ActivityEntry['action'] = verb.startsWith('join') ? 'joined' : 'left'
      setActivity(prev => [...prev, {
        id: nextId(),
        userName: name,
        action,
        timestamp: new Date()
      }])
    }

    const onStatus = (names: string[]) => setUsers(names)

    emitter.on(AppEvents.MESSAGE_RECEIVED, onMessage)
    emitter.on(AppEvents.ACTIVITYLOG_UPDATED, onActivity)
    emitter.on(AppEvents.STATUS_UPDATED, onStatus)

    return () => {
      emitter.off(AppEvents.MESSAGE_RECEIVED, onMessage)
      emitter.off(AppEvents.ACTIVITYLOG_UPDATED, onActivity)
      emitter.off(AppEvents.STATUS_UPDATED, onStatus)
    }
  }, [emitter, userName])

  const handleSubmit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    emitter.emit(AppEvents.MESSAGE_SENT, trimmed)
    setDraft('')
    setScrollOffset(0)
  }

  return (
    <Box flexDirection='column' width={cols} height={rows}>
      <Header room={room} userName={userName} connected />
      <Box height={bodyH} width={cols} flexShrink={0}>
        <Sidebar
          users={users}
          activity={activity}
          currentUser={userName}
          colorService={colorService}
          height={bodyH}
          width={SIDEBAR_W}
        />
        <Box flexGrow={1} height={bodyH}>
          <Messages
            messages={messages}
            colorService={colorService}
            height={bodyH}
            scrollOffset={scrollOffset}
          />
        </Box>
      </Box>
      <InputBar
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        userName={userName}
        userColor={colorService.getColor(userName)}
        scrolledUp={scrollOffset > 0}
      />
    </Box>
  )
}
