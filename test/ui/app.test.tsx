import { describe, it, expect, vi } from 'vitest'
import EventEmitter from 'node:events'
import { render } from 'ink-testing-library'
import { App } from '../../src/ui/app.js'
import { AppEvents } from '../../src/events/app-events.js'

const ESC = String.fromCharCode(27)

const KEY = {
  escape: ESC,
  pageUp: ESC + '[5~',
  pageDown: ESC + '[6~',
  end: ESC + '[F',
  enter: '\r'
} as const

/** Let React commit whatever the last emit or keystroke triggered. */
const settle = () => new Promise(resolve => setTimeout(resolve, 20))

/**
 * Render `App` in a terminal big enough for every panel. The test harness
 * reports no `rows`, so the app would otherwise fall back to its 12-row
 * minimum and clip the sidebar.
 */
function mount(userName = 'alice', room = 'general', rows = 40) {
  const emitter = new EventEmitter()
  const view = render(<App emitter={emitter} userName={userName} room={room} />)

  Object.defineProperty(view.stdout, 'rows', { value: rows, writable: true, configurable: true })
  view.stdout.emit('resize')

  return {
    ...view,
    emitter,
    frame: () => view.lastFrame() ?? '',
    /** Emit an app event and wait for the render it causes. */
    async emit(event: string, payload: unknown) {
      emitter.emit(event, payload)
      await settle()
    },
    async press(key: string) {
      view.stdin.write(key)
      await settle()
    }
  }
}

describe('App layout', () => {
  it('renders the header with the room and user', async() => {
    const { frame, unmount } = mount('alice', 'general')
    await settle()

    expect(frame()).toContain('#general')
    expect(frame()).toContain('@alice')
    unmount()
  })

  it('renders all four panels', async() => {
    const { frame, unmount } = mount()
    await settle()
    const output = frame()

    expect(output).toContain('online')
    expect(output).toContain('activity')
    expect(output).toContain('messages')
    expect(output).toContain('enter send')
    unmount()
  })

  it('starts with an empty message log and roster', async() => {
    const { frame, unmount } = mount()
    await settle()

    expect(frame()).toContain('no messages yet')
    expect(frame()).toContain('(empty)')
    expect(frame()).toContain('(no activity)')
    unmount()
  })
})

describe('App incoming events', () => {
  it('appends a received message to the log', async() => {
    const { emit, frame, unmount } = mount()

    await emit(AppEvents.MESSAGE_RECEIVED, { userName: 'bob', message: 'hello there' })

    expect(frame()).toContain('hello there')
    expect(frame()).toContain('bob')
    unmount()
  })

  it('keeps messages in arrival order', async() => {
    const { emit, frame, unmount } = mount()

    await emit(AppEvents.MESSAGE_RECEIVED, { userName: 'bob', message: 'first' })
    await emit(AppEvents.MESSAGE_RECEIVED, { userName: 'carol', message: 'second' })

    const output = frame()
    expect(output.indexOf('first')).toBeLessThan(output.indexOf('second'))
    unmount()
  })

  it('updates the roster on a status update', async() => {
    const { emit, frame, unmount } = mount()

    await emit(AppEvents.STATUS_UPDATED, ['alice', 'bob'])

    expect(frame()).toContain('alice')
    expect(frame()).toContain('bob')
    expect(frame()).toContain('(2)')
    unmount()
  })

  it('marks the local user in the roster', async() => {
    const { emit, frame, unmount } = mount('alice')

    await emit(AppEvents.STATUS_UPDATED, ['alice', 'bob'])

    expect(frame()).toContain('(you)')
    unmount()
  })

  it('records a join in the activity panel', async() => {
    const { emit, frame, unmount } = mount()

    await emit(AppEvents.ACTIVITYLOG_UPDATED, 'bob joined!')

    expect(frame()).toContain('bob')
    expect(frame()).not.toContain('(no activity)')
    unmount()
  })

  it('records a leave in the activity panel', async() => {
    const { emit, frame, unmount } = mount()

    await emit(AppEvents.ACTIVITYLOG_UPDATED, 'bob left!')

    expect(frame()).toContain('bob')
    unmount()
  })

  it('stops listening once unmounted', async() => {
    const { emitter, unmount } = mount()

    unmount()

    expect(emitter.listenerCount(AppEvents.MESSAGE_RECEIVED)).toBe(0)
    expect(emitter.listenerCount(AppEvents.ACTIVITYLOG_UPDATED)).toBe(0)
    expect(emitter.listenerCount(AppEvents.STATUS_UPDATED)).toBe(0)
  })
})

describe('App sending', () => {
  it('emits MESSAGE_SENT when the draft is submitted', async() => {
    const { emitter, press, unmount } = mount()
    const sent = vi.fn()
    emitter.on(AppEvents.MESSAGE_SENT, sent)

    await press('h')
    await press('i')
    await press(KEY.enter)

    expect(sent).toHaveBeenCalledWith('hi')
    unmount()
  })

  it('trims the submitted message', async() => {
    const { emitter, press, unmount } = mount()
    const sent = vi.fn()
    emitter.on(AppEvents.MESSAGE_SENT, sent)

    await press('  hi  ')
    await press(KEY.enter)

    expect(sent).toHaveBeenCalledWith('hi')
    unmount()
  })

  it('does not send a blank message', async() => {
    const { emitter, press, unmount } = mount()
    const sent = vi.fn()
    emitter.on(AppEvents.MESSAGE_SENT, sent)

    await press('   ')
    await press(KEY.enter)

    expect(sent).not.toHaveBeenCalled()
    unmount()
  })

  it('clears the draft after sending', async() => {
    const { press, frame, unmount } = mount()

    await press('hello')
    await press(KEY.enter)

    expect(frame()).toContain('type a message')
    unmount()
  })
})

describe('App scrolling', () => {
  /** Fill the log past one screenful. */
  async function withHistory() {
    const view = mount()
    for (let i = 0; i < 40; i++) {
      view.emitter.emit(AppEvents.MESSAGE_RECEIVED, { userName: 'bob', message: `msg-${i}` })
    }
    await settle()
    return view
  }

  it('follows the newest message by default', async() => {
    const { frame, unmount } = await withHistory()

    expect(frame()).toContain('msg-39')
    unmount()
  })

  it('pages back through history on page up', async() => {
    const { press, frame, unmount } = await withHistory()

    await press(KEY.pageUp)

    expect(frame()).toContain('paused')
    expect(frame()).not.toContain('msg-39')
    unmount()
  })

  it('pages forward again on page down', async() => {
    const { press, frame, unmount } = await withHistory()

    await press(KEY.pageUp)
    await press(KEY.pageDown)

    expect(frame()).toContain('msg-39')
    expect(frame()).not.toContain('paused')
    unmount()
  })

  it('jumps back to the newest message on end', async() => {
    const { press, frame, unmount } = await withHistory()

    await press(KEY.pageUp)
    await press(KEY.end)

    expect(frame()).toContain('msg-39')
    unmount()
  })

  it('holds position when new messages arrive while scrolled up', async() => {
    const { press, emit, frame, unmount } = await withHistory()

    await press(KEY.pageUp)
    const anchor = frame().match(/msg-\d+/)?.[0]
    await emit(AppEvents.MESSAGE_RECEIVED, { userName: 'bob', message: 'brand-new' })

    expect(frame()).not.toContain('brand-new')
    expect(frame()).toContain('paused')
    expect(frame()).toContain(anchor!)
    unmount()
  })
})
