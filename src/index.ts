import EventEmitter from 'events'
import { CliConfig } from './config/cli-config'
import { SocketClient } from './network/socket-client'
import { EventManager } from './events/event-manager'
import { TerminalController } from './ui/terminal-controller'

const [,, ...args] = process.argv
const config = CliConfig.parse(args)

const componentEmitter = new EventEmitter()
const socketClient = new SocketClient(config.server)

socketClient
  .connect()
  .then(() => {
    const eventManager = new EventManager(componentEmitter, socketClient)
    eventManager.registerSocketHandlers()
    eventManager.joinRoom({ roomId: config.room, userName: config.username })

    const terminal = new TerminalController()
    return terminal.initialize(componentEmitter)
  })
  .catch(error => {
    console.error('Error starting hackerchat.', error)
    process.exit(1)
  })
