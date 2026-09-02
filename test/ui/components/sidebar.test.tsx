import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import { Sidebar } from '../../../src/ui/components/sidebar.js'
import { UserColorService } from '../../../src/ui/user-color-service.js'
import type { ActivityEntry } from '../../../src/types/index.js'

const AT_10AM = new Date(2026, 0, 2, 10, 0, 0)

function activity(id: number, userName: string, action: 'joined' | 'left'): ActivityEntry {
  return { id, userName, action, timestamp: AT_10AM }
}

function renderSidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  const view = render(
    <Sidebar
      users={[]}
      activity={[]}
      currentUser='alice'
      colorService={new UserColorService()}
      height={20}
      width={30}
      {...props}
    />
  )
  const frame = view.lastFrame() ?? ''
  view.unmount()
  return frame
}

describe('Sidebar online panel', () => {
  it('shows an empty state with no users', () => {
    expect(renderSidebar()).toContain('(empty)')
  })

  it('lists every connected user', () => {
    const frame = renderSidebar({ users: ['alice', 'bob'] })

    expect(frame).toContain('alice')
    expect(frame).toContain('bob')
  })

  it('shows the online count', () => {
    expect(renderSidebar({ users: ['alice', 'bob', 'carol'] })).toContain('(3)')
  })

  it('marks the current user', () => {
    expect(renderSidebar({ users: ['alice', 'bob'] })).toContain('(you)')
  })

  it('does not mark anyone when the current user is absent', () => {
    expect(renderSidebar({ users: ['bob'], currentUser: 'alice' })).not.toContain('(you)')
  })

  it('summarises users that do not fit', () => {
    const users = Array.from({ length: 20 }, (_, i) => `user${i}`)

    expect(renderSidebar({ users, height: 20 })).toContain('more')
  })

  it('does not summarise when everyone fits', () => {
    expect(renderSidebar({ users: ['alice', 'bob'], height: 20 })).not.toContain('more')
  })
})

describe('Sidebar activity panel', () => {
  it('shows an empty state with no activity', () => {
    expect(renderSidebar()).toContain('(no activity)')
  })

  it('renders a join with a plus marker', () => {
    const frame = renderSidebar({ activity: [activity(1, 'bob', 'joined')] })

    expect(frame).toContain('+')
    expect(frame).toContain('bob')
  })

  it('renders a leave with a minus marker', () => {
    const frame = renderSidebar({ activity: [activity(1, 'bob', 'left')] })

    expect(frame).toContain('-')
    expect(frame).toContain('bob')
  })

  it('stamps each entry with its short time', () => {
    expect(renderSidebar({ activity: [activity(1, 'bob', 'joined')] })).toContain('10:00')
  })

  it('keeps the most recent entries when the panel overflows', () => {
    const entries = Array.from({ length: 30 }, (_, i) => activity(i, `user${i}`, 'joined'))

    const frame = renderSidebar({ activity: entries, height: 20 })

    expect(frame).toContain('user29')
    expect(frame).not.toContain('user0 ')
  })

  it('renders both panel headings', () => {
    const frame = renderSidebar()

    expect(frame).toContain('online')
    expect(frame).toContain('activity')
  })
})
