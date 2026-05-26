import EventEmitter from 'events'
import { render } from 'ink'
import { createElement } from 'react'
import { CliConfig } from './config/cli-config.js'
import { SocketClient } from './network/socket-client.js'
import { EventManager } from './events/event-manager.js'
import { App } from './ui/app.js'

const [,, ...args] = process.argv
const config = CliConfig.parse(args)

const componentEmitter = new EventEmitter()
const socketClient = new SocketClient(config.server)

let altScreenActive = false

const enterAltScreen = () => {
  if (altScreenActive) return
  altScreenActive = true
  process.stdout.write('\x1b[?1049h\x1b[2J\x1b[3J\x1b[H')
}

const leaveAltScreen = () => {
  if (!altScreenActive) return
  altScreenActive = false
  process.stdout.write('\x1b[?1049l')
}

process.on('exit', leaveAltScreen)
process.on('SIGINT', () => { leaveAltScreen(); process.exit(0) })
process.on('SIGTERM', () => { leaveAltScreen(); process.exit(0) })
process.on('uncaughtException', err => {
  leaveAltScreen()
  console.error(err)
  process.exit(1)
})

socketClient
  .connect()
  .then(() => {
    const eventManager = new EventManager(componentEmitter, socketClient)
    eventManager.registerSocketHandlers()
    eventManager.joinRoom({ roomId: config.room, userName: config.username })

    enterAltScreen()

    const instance = render(createElement(App, {
      emitter: componentEmitter,
      userName: config.username,
      room: config.room
    }), { exitOnCtrlC: false, patchConsole: false })

    instance.waitUntilExit().finally(() => {
      leaveAltScreen()
      process.exit(0)
    })
  })
  .catch(error => {
    leaveAltScreen()
    console.error('Error starting hackerchat.', error)
    process.exit(1)
  })
