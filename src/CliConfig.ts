import chalk from 'chalk'
import * as Types from './@types/CliConfigTypes'

const DEFAULT_URL = 'https://hackerchat-server.herokuapp.com'

export default class CliConfig {
  username
  room
  hostUri
  port
  protocol

  /**
   * CliConfig constructor.
   * 
   * @param {{username: string, hostUri: string, room: string}} params
   * @returns {void} void
   */
  constructor({ username, hostUri = DEFAULT_URL, room }: Types.ClientSettings) {
    this.username = username
    this.room = room

    const { hostname, port, protocol } = new URL(hostUri)

    this.hostUri = hostname
    this.port = port
    this.protocol = protocol.replace(/\W/, '')
  }

  /**
   * Parse the arguments and call the class constructor, to parse the map to an object.
   * 
   * @param {string[]} commands 
   * @returns {CliConfig} CliConfig
   */
  static parseArguments(commands: string[]): CliConfig {
    const cmd = new Map()
    const commandPrefix = '--'

    for (const key in commands) {
      const index = parseInt(key)
      const command = commands[key]

      if (!command.includes(commandPrefix)) continue
      cmd.set(
        command.replace(commandPrefix, ''),
        commands[index + 1]
      )
    }

    CliConfig.validateArguments(cmd)

    return new CliConfig(Object.fromEntries(cmd))
  }

  /**
   * Validate the arguments.
   *
   * @param {Map<string><string>} cmd
   * @returns {void} 
   */
  static validateArguments(cmd: Map<string, string>): void {
    const userName = cmd.get('username')
    const room = cmd.get('room')
    let error = false
    
    if (typeof userName === 'undefined' || userName === null) {
      console.error(chalk.red('ERROR!'), 'You need to specify the username with the --username flag.')
      error = true
    }

    if (typeof room === 'undefined' || room === null) {
      console.error(chalk.red('ERROR!'), 'You need to specify the room with the --room flag.')
      error = true
    }

    if (error) {
      process.exit(0)
    }
  }
}