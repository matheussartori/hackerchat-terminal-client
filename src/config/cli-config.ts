import chalk from 'chalk'
import type { ClientSettings, ServerConfig } from '../types/index.js'

const DEFAULT_URL = 'https://hackerchat-server.herokuapp.com'

export class CliConfig {
  readonly username: string
  readonly room: string
  readonly server: ServerConfig

  constructor({ username, hostUri = DEFAULT_URL, room }: ClientSettings) {
    this.username = username
    this.room = room
    this.server = CliConfig.parseServerConfig(hostUri)
  }

  static parse(args: string[]): CliConfig {
    const cmd = new Map<string, string>()

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (arg.startsWith('--')) {
        cmd.set(arg.slice(2), args[i + 1] ?? '')
      }
    }

    CliConfig.validate(cmd)

    return new CliConfig(Object.fromEntries(cmd) as unknown as ClientSettings)
  }

  private static validate(cmd: Map<string, string>): void {
    const errors: string[] = []

    if (!cmd.get('username')) {
      errors.push('You need to specify the username with the --username flag.')
    }

    if (!cmd.get('room')) {
      errors.push('You need to specify the room with the --room flag.')
    }

    if (errors.length > 0) {
      errors.forEach(msg => console.error(chalk.red('ERROR!'), msg))
      process.exit(1)
    }
  }

  private static parseServerConfig(hostUri: string): ServerConfig {
    const { hostname, port, protocol } = new URL(hostUri)
    const rawProtocol = protocol.replace(/\W/g, '')
    const normalizedProtocol = rawProtocol === 'wss'
      ? 'https'
      : rawProtocol === 'ws'
        ? 'http'
        : rawProtocol

    return { hostUri: hostname, port, protocol: normalizedProtocol }
  }
}
