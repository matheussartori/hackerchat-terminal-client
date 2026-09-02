import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Messages } from '../../../src/ui/components/messages.js'
import { UserColorService } from '../../../src/ui/user-color-service.js'
import type { ChatEntry } from '../../../src/types/index.js'

const AT_10AM = new Date(2026, 0, 2, 10, 0, 0)

function entry(id: number, userName: string, message: string): ChatEntry {
  return { id, userName, message, timestamp: AT_10AM }
}

function renderMessages(props: Partial<Parameters<typeof Messages>[0]> = {}) {
  const view = render(
    <Messages
      messages={[]}
      colorService={new UserColorService()}
      height={10}
      scrollOffset={0}
      {...props}
    />
  )
  const frame = view.lastFrame() ?? ''
  view.unmount()
  return frame
}

describe('Messages', () => {
  it('shows an empty state when there is nothing to display', () => {
    expect(renderMessages()).toContain('no messages yet')
  })

  it('renders the author and body of each message', () => {
    const frame = renderMessages({ messages: [entry(1, 'alice', 'hello there')] })

    expect(frame).toContain('alice')
    expect(frame).toContain('hello there')
  })

  it('prefixes each message with its short timestamp', () => {
    expect(renderMessages({ messages: [entry(1, 'alice', 'hi')] })).toContain('10:00')
  })

  it('counts visible messages against the total', () => {
    const messages = [entry(1, 'alice', 'a'), entry(2, 'bob', 'b')]

    expect(renderMessages({ messages })).toContain('2/2')
  })

  it('keeps the newest messages when the log outgrows the viewport', () => {
    const messages = Array.from({ length: 20 }, (_, i) => entry(i, 'alice', `msg-${i}`))

    const frame = renderMessages({ messages, height: 10 })

    expect(frame).toContain('msg-19')
    expect(frame).not.toContain('msg-0\n')
  })

  it('marks how many messages are hidden above', () => {
    const messages = Array.from({ length: 20 }, (_, i) => entry(i, 'alice', `msg-${i}`))

    expect(renderMessages({ messages, height: 10 })).toContain('↑13')
  })

  it('scrolls back through history with a scroll offset', () => {
    const messages = Array.from({ length: 20 }, (_, i) => entry(i, 'alice', `msg-${i}`))

    const frame = renderMessages({ messages, height: 10, scrollOffset: 5 })

    expect(frame).toContain('msg-14')
    expect(frame).not.toContain('msg-19')
  })

  it('marks how many messages are hidden below when scrolled up', () => {
    const messages = Array.from({ length: 20 }, (_, i) => entry(i, 'alice', `msg-${i}`))

    expect(renderMessages({ messages, height: 10, scrollOffset: 5 })).toContain('↓5')
  })

  it('always selects at least one message, however short the box', () => {
    const messages = [entry(1, 'alice', 'only one')]

    // At height 3 the border and heading consume the whole box, so the row is
    // clipped -- but the counter shows the slice still picked one message.
    expect(renderMessages({ messages, height: 3 })).toContain('1/1')
    expect(renderMessages({ messages, height: 5 })).toContain('only one')
  })

  it('renders a heading', () => {
    expect(renderMessages()).toContain('messages')
  })
})
