import { describe, it, expect, beforeEach } from 'vitest'
import { UserStore } from '../../src/state/user-store'

describe('UserStore', () => {
  let store: UserStore

  beforeEach(() => {
    store = new UserStore()
  })

  describe('add()', () => {
    it('adds a user', () => {
      store.add({ id: '1', userName: 'alice' })
      expect(store.getNames()).toContain('alice')
    })

    it('adds multiple users', () => {
      store.add({ id: '1', userName: 'alice' })
      store.add({ id: '2', userName: 'bob' })
      expect(store.getNames()).toEqual(expect.arrayContaining(['alice', 'bob']))
    })

    it('overwrites an existing entry when id matches', () => {
      store.add({ id: '1', userName: 'alice' })
      store.add({ id: '1', userName: 'alice2' })
      expect(store.getNames()).toEqual(['alice2'])
    })
  })

  describe('remove()', () => {
    it('removes a user by id', () => {
      store.add({ id: '1', userName: 'alice' })
      store.remove('1')
      expect(store.getNames()).not.toContain('alice')
    })

    it('is a no-op for non-existent id', () => {
      store.add({ id: '1', userName: 'alice' })
      store.remove('999')
      expect(store.getNames()).toContain('alice')
    })
  })

  describe('updateAll()', () => {
    it('adds new users from the list', () => {
      store.updateAll([
        { id: '1', userName: 'alice' },
        { id: '2', userName: 'bob' },
      ])
      expect(store.getNames()).toEqual(expect.arrayContaining(['alice', 'bob']))
    })

    it('updates existing entries by id', () => {
      store.add({ id: '1', userName: 'alice' })
      store.updateAll([{ id: '1', userName: 'alice-updated' }])
      expect(store.getNames()).toContain('alice-updated')
      expect(store.getNames()).not.toContain('alice')
    })
  })

  describe('getNames()', () => {
    it('returns empty array when no users', () => {
      expect(store.getNames()).toEqual([])
    })

    it('returns all stored usernames', () => {
      store.add({ id: '1', userName: 'alice' })
      store.add({ id: '2', userName: 'bob' })
      expect(store.getNames()).toHaveLength(2)
    })
  })
})
