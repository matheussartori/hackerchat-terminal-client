import { describe, it, expect, vi, beforeEach } from 'vitest'
import EventEmitter from 'events'
import { EventManager } from '../../src/events/event-manager'
import { AppEvents, SocketEvents } from '../../src/events/app-events'
import type { SocketClient } from '../../src/network/socket-client'

class MockSocketClient extends EventEmitter {
  send = vi.fn()
}

describe('EventManager', () => {
  let componentEmitter: EventEmitter
  let socketClient: MockSocketClient
  let manager: EventManager

  beforeEach(() => {
    componentEmitter = new EventEmitter()
    socketClient = new MockSocketClient()
    manager = new EventManager(componentEmitter, socketClient as unknown as SocketClient)
  })

  describe('joinRoom()', () => {
    it('sends JOIN_ROOM to the socket', () => {
      const payload = { username: 'alice', room: 'general' }
      manager.joinRoom(payload)
      expect(socketClient.send).toHaveBeenCalledWith(SocketEvents.JOIN_ROOM, payload)
    })

    it('forwards MESSAGE_SENT events to the socket', () => {
      manager.joinRoom({ username: 'alice', room: 'general' })
      componentEmitter.emit(AppEvents.MESSAGE_SENT, 'hello world')
      expect(socketClient.send).toHaveBeenCalledWith(SocketEvents.MESSAGE, 'hello world')
    })

    it('forwards multiple messages', () => {
      manager.joinRoom({ username: 'alice', room: 'general' })
      componentEmitter.emit(AppEvents.MESSAGE_SENT, 'first')
      componentEmitter.emit(AppEvents.MESSAGE_SENT, 'second')
      expect(socketClient.send).toHaveBeenCalledTimes(3) // 1 joinRoom + 2 messages
    })
  })

  describe('registerSocketHandlers()', () => {
    beforeEach(() => {
      manager.registerSocketHandlers()
    })

    describe('updateUsers', () => {
      it('emits STATUS_UPDATED with user names', () => {
        const listener = vi.fn()
        componentEmitter.on(AppEvents.STATUS_UPDATED, listener)
        socketClient.emit('updateUsers', [{ id: '1', userName: 'alice' }])
        expect(listener).toHaveBeenCalledWith(['alice'])
      })

      it('reflects multiple users in STATUS_UPDATED', () => {
        const listener = vi.fn()
        componentEmitter.on(AppEvents.STATUS_UPDATED, listener)
        socketClient.emit('updateUsers', [
          { id: '1', userName: 'alice' },
          { id: '2', userName: 'bob' }
        ])
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining(['alice', 'bob']))
      })
    })

    describe('disconnectUser', () => {
      it('emits ACTIVITYLOG_UPDATED with leave message', () => {
        const listener = vi.fn()
        componentEmitter.on(AppEvents.ACTIVITYLOG_UPDATED, listener)
        socketClient.emit('disconnectUser', { id: '1', userName: 'alice' })
        expect(listener).toHaveBeenCalledWith('alice left!')
      })

      it('emits STATUS_UPDATED without the removed user', () => {
        socketClient.emit('updateUsers', [
          { id: '1', userName: 'alice' },
          { id: '2', userName: 'bob' }
        ])
        const listener = vi.fn()
        componentEmitter.on(AppEvents.STATUS_UPDATED, listener)
        socketClient.emit('disconnectUser', { id: '1', userName: 'alice' })
        expect(listener).toHaveBeenCalledWith(expect.not.arrayContaining(['alice']))
      })
    })

    describe('newUserConnected', () => {
      it('emits ACTIVITYLOG_UPDATED with join message', () => {
        const listener = vi.fn()
        componentEmitter.on(AppEvents.ACTIVITYLOG_UPDATED, listener)
        socketClient.emit('newUserConnected', { id: '2', userName: 'bob' })
        expect(listener).toHaveBeenCalledWith('bob joined!')
      })

      it('emits STATUS_UPDATED including the new user', () => {
        const listener = vi.fn()
        componentEmitter.on(AppEvents.STATUS_UPDATED, listener)
        socketClient.emit('newUserConnected', { id: '2', userName: 'bob' })
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining(['bob']))
      })
    })

    describe('message', () => {
      it('emits MESSAGE_RECEIVED with the full message object', () => {
        const listener = vi.fn()
        componentEmitter.on(AppEvents.MESSAGE_RECEIVED, listener)
        const msg = { userName: 'alice', content: 'hello' }
        socketClient.emit('message', msg)
        expect(listener).toHaveBeenCalledWith(msg)
      })
    })
  })
})
