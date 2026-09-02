import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import { Text } from 'ink'
import { useClock, formatTime, formatShortTime } from '../../src/ui/hooks/use-clock.js'

describe('formatTime', () => {
  it('renders HH:MM:SS', () => {
    expect(formatTime(new Date(2026, 0, 2, 14, 5, 9))).toBe('14:05:09')
  })

  it('zero-pads every field', () => {
    expect(formatTime(new Date(2026, 0, 2, 0, 0, 0))).toBe('00:00:00')
  })

  it('uses 24-hour time', () => {
    expect(formatTime(new Date(2026, 0, 2, 23, 59, 59))).toBe('23:59:59')
  })
})

describe('formatShortTime', () => {
  it('renders HH:MM without seconds', () => {
    expect(formatShortTime(new Date(2026, 0, 2, 14, 5, 9))).toBe('14:05')
  })

  it('zero-pads every field', () => {
    expect(formatShortTime(new Date(2026, 0, 2, 7, 3, 0))).toBe('07:03')
  })
})

function Clock() {
  return <Text>{formatTime(useClock())}</Text>
}

/**
 * Advance fake timers, then yield once more so React's scheduler drains and
 * ink writes the resulting frame. A single `advanceTimersByTimeAsync` runs the
 * interval callback but returns before the new frame is rendered.
 */
async function tick(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
  await vi.advanceTimersByTimeAsync(0)
}

describe('useClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts at the current time', () => {
    vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0))

    const { lastFrame, unmount } = render(<Clock />)

    expect(lastFrame()).toBe('10:00:00')
    unmount()
  })

  it('ticks once a second', async() => {
    vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0))
    const { lastFrame, unmount } = render(<Clock />)

    await tick(1000)

    expect(lastFrame()).toBe('10:00:01')
    unmount()
  })

  it('keeps ticking across several seconds', async() => {
    vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0))
    const { lastFrame, unmount } = render(<Clock />)

    await tick(3000)

    expect(lastFrame()).toBe('10:00:03')
    unmount()
  })

  it('does not update between ticks', async() => {
    vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0))
    const { lastFrame, unmount } = render(<Clock />)

    await tick(999)

    expect(lastFrame()).toBe('10:00:00')
    unmount()
  })

  it('clears its interval on unmount', async() => {
    vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0))
    const clearInterval = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(<Clock />)

    unmount()

    expect(clearInterval).toHaveBeenCalled()
  })
})
