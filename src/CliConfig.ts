import * as Types from './@types/CliConfigTypes'

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
  constructor({ username, hostUri, room }: Types.ClientSettings) {
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

    return new CliConfig(Object.fromEntries(cmd))
  }
}