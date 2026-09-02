import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import { InputBar } from '../../../src/ui/components/input-bar.js'

type Props = Parameters<typeof InputBar>[0]

function renderInputBar(props: Partial<Props> = {}) {
  const view = render(
    <InputBar
      value=''
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      userName='alice'
      userColor='#ff7eb6'
      cols={80}
      {...props}
    />
  )
  const frame = view.lastFrame() ?? ''
  view.unmount()
  return frame
}

describe('InputBar', () => {
  it('shows the author name as the prompt', () => {
    expect(renderInputBar()).toContain('alice')
  })

  it('starts the counter at zero', () => {
    expect(renderInputBar()).toContain('0/500')
  })

  it('counts the characters typed so far', () => {
    expect(renderInputBar({ value: 'hello' })).toContain('5/500')
  })

  it('shows the placeholder while empty', () => {
    expect(renderInputBar()).toContain('type a message')
  })

  it('renders the value once there is one', () => {
    expect(renderInputBar({ value: 'hello there' })).toContain('hello there')
  })

  it('lists the keyboard shortcuts', () => {
    const frame = renderInputBar()

    expect(frame).toContain('enter send')
    expect(frame).toContain('esc quit')
  })

  it('flags a paused scroll', () => {
    expect(renderInputBar({ scrolledUp: true })).toContain('paused')
  })

  it('does not flag a pause while following the log', () => {
    expect(renderInputBar({ scrolledUp: false })).not.toContain('paused')
  })

  it('keeps the counter accurate near the limit', () => {
    expect(renderInputBar({ value: 'x'.repeat(430) })).toContain('430/500')
  })

  it('keeps the counter accurate at the limit', () => {
    expect(renderInputBar({ value: 'x'.repeat(500) })).toContain('500/500')
  })

  it('still renders in a very narrow terminal', () => {
    expect(renderInputBar({ cols: 20 })).toContain('alice')
  })
})
