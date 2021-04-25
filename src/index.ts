#!/usr/bin/env node

import Events from "events";
import CliConfig from "./CliConfig";
import TerminalController from "./TerminalController";
import SocketClient from "./SocketClient";
import EventManager from "./EventManager";

const [,, ...commands] = process.argv;
const config = CliConfig.parseArguments(commands);

const componentEmitter = new Events();
const socketClient = new SocketClient(config);
socketClient
  .initialize()
  .then(() => {
    const eventManager = new EventManager({ componentEmitter, socketClient });
    const events = eventManager.getEvents();
    // @ts-ignore
    socketClient.attachEvents(events);
    const data = {
      roomId: config.room,
      userName: config.username,
    };
    eventManager.joinRoomWaitMessages(data);

    const controller = new TerminalController();
    controller.initializeTable(componentEmitter);
  })
  .catch((error) => {
    console.error("Error starting the terminal client for hackerchat.");
  });
