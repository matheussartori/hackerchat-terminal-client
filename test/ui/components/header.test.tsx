import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render } from 'ink-testing-library'
import { Header } from '../../../src/ui/components/header.js'

function renderHeader(props: Partial<Parameters<typeof Header>[0]> = {}) {
  const view = render(<Header room='general' userName='alice' connected {...props} />)
  const frame = view.lastFrame() ?? ''
  view.unmount()
  return frame
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 2, 14, 30, 45))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Header', () => {
  it('shows the product name', () => {
    expect(renderHeader()).toContain('hackerchat')
  })

  it('shows the version npm published', () => {
    const { version } = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    ) as { version: string }

    expect(renderHeader()).toContain(`v${version}`)
  })

  it('shows the room with a hash prefix', () => {
    expect(renderHeader({ room: 'general' })).toContain('#general')
  })

  it('shows the user with an at prefix', () => {
    expect(renderHeader({ userName: 'alice' })).toContain('@alice')
  })

  it('reports an online connection', () => {
    const frame = renderHeader({ connected: true })

    expect(frame).toContain('online')
    expect(frame).not.toContain('offline')
  })

  it('reports a dropped connection', () => {
    expect(renderHeader({ connected: false })).toContain('offline')
  })

  it('shows the current time', () => {
    expect(renderHeader()).toContain('14:30:45')
  })
})
