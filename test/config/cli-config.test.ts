import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CliConfig } from '../../src/config/cli-config'

describe('CliConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('parse()', () => {
    it('parses username and room from args', () => {
      const config = CliConfig.parse(['--username', 'alice', '--room', 'general'])
      expect(config.username).toBe('alice')
      expect(config.room).toBe('general')
    })

    it('uses default server when --hostUri is omitted', () => {
      const config = CliConfig.parse(['--username', 'alice', '--room', 'general'])
      expect(config.server.hostUri).toBe('hackerchat-server.herokuapp.com')
      expect(config.server.protocol).toBe('https')
    })

    it('parses custom --hostUri', () => {
      const config = CliConfig.parse([
        '--username', 'alice',
        '--room', 'general',
        '--hostUri', 'http://localhost:3000'
      ])
      expect(config.server.hostUri).toBe('localhost')
      expect(config.server.port).toBe('3000')
      expect(config.server.protocol).toBe('http')
    })

    it('exits with code 1 when --username is missing', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit') })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => CliConfig.parse(['--room', 'general'])).toThrow('exit')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('exits with code 1 when --room is missing', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit') })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => CliConfig.parse(['--username', 'alice'])).toThrow('exit')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('exits with code 1 when both --username and --room are missing', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit') })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => CliConfig.parse([])).toThrow('exit')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('ignores unknown flags', () => {
      const config = CliConfig.parse(['--username', 'alice', '--room', 'general', '--unknown', 'value'])
      expect(config.username).toBe('alice')
      expect(config.room).toBe('general')
    })
  })

  describe('parseServerConfig()', () => {
    it('normalizes wss to https', () => {
      const config = CliConfig.parse(['--username', 'a', '--room', 'r', '--hostUri', 'wss://example.com'])
      expect(config.server.protocol).toBe('https')
    })

    it('normalizes ws to http', () => {
      const config = CliConfig.parse(['--username', 'a', '--room', 'r', '--hostUri', 'ws://example.com'])
      expect(config.server.protocol).toBe('http')
    })

    it('keeps https as-is', () => {
      const config = CliConfig.parse(['--username', 'a', '--room', 'r', '--hostUri', 'https://example.com'])
      expect(config.server.protocol).toBe('https')
    })

    it('keeps http as-is', () => {
      const config = CliConfig.parse(['--username', 'a', '--room', 'r', '--hostUri', 'http://example.com'])
      expect(config.server.protocol).toBe('http')
    })

    it('extracts hostname without port', () => {
      const config = CliConfig.parse(['--username', 'a', '--room', 'r', '--hostUri', 'https://chat.example.com'])
      expect(config.server.hostUri).toBe('chat.example.com')
      expect(config.server.port).toBe('')
    })
  })
})
