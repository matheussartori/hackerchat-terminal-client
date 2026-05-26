import { describe, it, expect, beforeEach } from 'vitest'
import { UserColorService } from '../../src/ui/user-color-service'

describe('UserColorService', () => {
  let service: UserColorService

  beforeEach(() => {
    service = new UserColorService()
  })

  it('returns a color string in the expected format', () => {
    const color = service.getColor('alice')
    expect(color).toMatch(/^#[0-9a-f]{6}-fg$/)
  })

  it('returns the same color for the same username (cache)', () => {
    const first = service.getColor('alice')
    const second = service.getColor('alice')
    expect(first).toBe(second)
  })

  it('assigns independent colors to different usernames', () => {
    const colors = new Set(
      Array.from({ length: 20 }, (_, i) => service.getColor(`user${i}`))
    )
    expect(colors.size).toBeGreaterThan(1)
  })

  it('caches colors across multiple calls', () => {
    service.getColor('alice')
    service.getColor('bob')
    expect(service.getColor('alice')).toBe(service.getColor('alice'))
    expect(service.getColor('bob')).toBe(service.getColor('bob'))
  })
})
