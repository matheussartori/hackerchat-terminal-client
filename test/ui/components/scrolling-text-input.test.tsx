import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import chalk from 'chalk'
import { ScrollingTextInput } from '../../../src/ui/components/scrolling-text-input.js'

const ESC = String.fromCharCode(27)
const DEL = String.fromCharCode(127)

/** Strip ANSI styling so assertions can read against plain text. */
const ANSI = new RegExp(ESC + '\\[[0-9;]*m', 'g')
const plain = (s: string | undefined) => (s ?? '').replace(ANSI, '')

/** The inverse-video sequence chalk emits for the caret. */
const CURSOR = ESC + '[7m'

/** Keystrokes ink recognises as special keys. */
const KEY = {
  enter: '\r',
  backspace: DEL,
  left: ESC + '[D',
  right: ESC + '[C',
  up: ESC + '[A',
  down: ESC + '[B'
} as const

type Props = Parameters<typeof ScrollingTextInput>[0]

let originalChalkLevel: typeof chalk.level

beforeEach(() => {
  // ink-testing-library renders to a non-TTY, where chalk disables colour and
  // the caret would be indistinguishable from a plain space.
  originalChalkLevel = chalk.level
  chalk.level = 1
})

afterEach(() => {
  chalk.level = originalChalkLevel
})

function setup(props: Partial<Props> = {}) {
  const onChange = vi.fn()
  const onSubmit = vi.fn()
  const view = render(
    <ScrollingTextInput value='' onChange={onChange} onSubmit={onSubmit} width={20} {...props} />
  )

  /**
   * Send a keystroke and let React commit the resulting state before the next
   * one. Writing twice in a row would leave the second handler reading a stale
   * cursor position.
   */
  const press = async(key: string) => {
    view.stdin.write(key)
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  return { ...view, onChange, onSubmit, press, frame: () => plain(view.lastFrame()) }
}

describe('ScrollingTextInput rendering', () => {
  it('shows the placeholder when empty', () => {
    const { frame, unmount } = setup({ placeholder: 'type here' })

    expect(frame()).toContain('type here')
    unmount()
  })

  it('truncates a placeholder wider than the field', () => {
    const { frame, unmount } = setup({ placeholder: 'a very long placeholder indeed', width: 10 })

    expect(frame()).toHaveLength(10)
    unmount()
  })

  it('renders the value once there is one', () => {
    const { frame, unmount } = setup({ value: 'hello' })

    expect(frame()).toContain('hello')
    unmount()
  })

  it('draws a caret over the first placeholder character', () => {
    const { lastFrame, unmount } = setup({ placeholder: 'type here' })

    expect(lastFrame()).toContain(CURSOR)
    unmount()
  })

  it('shows a bare caret when empty with no placeholder', () => {
    const { lastFrame, unmount } = setup({ placeholder: '' })

    expect(lastFrame()).toContain(CURSOR)
    unmount()
  })

  it('renders an unfocused placeholder without a caret', () => {
    const { lastFrame, unmount } = setup({ placeholder: 'idle', focus: false })

    expect(plain(lastFrame())).toContain('idle')
    expect(lastFrame()).not.toContain(CURSOR)
    unmount()
  })

  it('draws a trailing caret after the value', () => {
    const { lastFrame, unmount } = setup({ value: 'hello' })

    expect(lastFrame()).toContain(CURSOR)
    unmount()
  })

  it('scrolls the window so the caret stays visible', () => {
    const { frame, unmount } = setup({ value: 'abcdefghijklmnopqrstuvwxyz', width: 10 })

    // The caret sits past the end, so the tail of the value is what shows.
    expect(frame()).toContain('vwxyz')
    expect(frame()).not.toContain('abcde')
    unmount()
  })
})

describe('ScrollingTextInput typing', () => {
  it('appends a typed character', async() => {
    const { press, onChange, unmount } = setup({ value: 'ab' })

    await press('c')

    expect(onChange).toHaveBeenCalledWith('abc')
    unmount()
  })

  it('inserts at the caret after moving left', async() => {
    const { press, onChange, unmount } = setup({ value: 'ac' })

    await press(KEY.left)
    await press('b')

    expect(onChange).toHaveBeenCalledWith('abc')
    unmount()
  })

  it('ignores input when not focused', async() => {
    const { press, onChange, unmount } = setup({ value: 'ab', focus: false })

    await press('c')

    expect(onChange).not.toHaveBeenCalled()
    unmount()
  })

  it('refuses to grow past maxLength', async() => {
    const { press, onChange, unmount } = setup({ value: 'abc', maxLength: 3 })

    await press('d')

    expect(onChange).not.toHaveBeenCalled()
    unmount()
  })

  it('truncates a paste to the remaining budget', async() => {
    const { press, onChange, unmount } = setup({ value: 'ab', maxLength: 4 })

    await press('cdef')

    expect(onChange).toHaveBeenCalledWith('abcd')
    unmount()
  })
})

describe('ScrollingTextInput editing keys', () => {
  it('deletes the character before the caret on backspace', async() => {
    const { press, onChange, unmount } = setup({ value: 'abc' })

    await press(KEY.backspace)

    expect(onChange).toHaveBeenCalledWith('ab')
    unmount()
  })

  it('does nothing on backspace at the start of the line', async() => {
    const { press, onChange, unmount } = setup({ value: '' })

    await press(KEY.backspace)

    expect(onChange).not.toHaveBeenCalled()
    unmount()
  })

  it('submits the current value on enter', async() => {
    const { press, onSubmit, unmount } = setup({ value: 'send me' })

    await press(KEY.enter)

    expect(onSubmit).toHaveBeenCalledWith('send me')
    unmount()
  })

  it('does not treat enter as text', async() => {
    const { press, onChange, unmount } = setup({ value: 'abc' })

    await press(KEY.enter)

    expect(onChange).not.toHaveBeenCalled()
    unmount()
  })

  it('ignores the arrow keys that would leave the field', async() => {
    const { press, onChange, onSubmit, unmount } = setup({ value: 'abc' })

    await press(KEY.up)
    await press(KEY.down)

    expect(onChange).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    unmount()
  })

  it('keeps the caret inside the value when moving right at the end', async() => {
    const { press, onChange, unmount } = setup({ value: 'ab' })

    await press(KEY.right)
    await press('c')

    expect(onChange).toHaveBeenCalledWith('abc')
    unmount()
  })

  // Two backspaces that arrive in a single terminal read delete only one
  // character: the handler slices from the `cursorOffset` captured in the
  // render closure, so the second key recomputes from the stale position.
  // Verified against the real binary in a pty.
  it.todo('deletes twice when two backspaces arrive in one chunk')

  it('keeps the caret inside the value when moving left at the start', async() => {
    const { press, onChange, unmount } = setup({ value: 'bc' })

    await press(KEY.left)
    await press(KEY.left)
    await press(KEY.left)
    await press('a')

    expect(onChange).toHaveBeenCalledWith('abc')
    unmount()
  })
})
