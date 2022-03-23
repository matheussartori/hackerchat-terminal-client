<p align="center">
  <img alt="Hackerchat Terminal Client" height="350" src="https://github.com/redstone-solutions/hackerchat-terminal-client/raw/main/assets/hackerchat-terminal-client.png" />
</p>

<h3 align="center">
  Hackerchat Terminal Client
</h3>

<blockquote align="center">"This software is a continued idea of the project created by Erick Wendel."</blockquote>
<br>

<p align="center">
  <a href="https://redstonesolutions.com.br">
    <img alt="Made by Redstone Solutions" src="https://img.shields.io/badge/made%20by-Redstone%20Solutions-%2304D361">
  </a>

  <img alt="License" src="https://img.shields.io/badge/license-MIT-%2304D361">
</p>

<p align="center">
  <a href="#about-the-project">About the project</a><br>
  <a href="#installation">Installation</a><br>
  <a href="#connecting-to-a-server">Connecting to a server</a><br>
  <a href="#closing-the-chat">Closing the chat</a><br>
</p>

## About the project

Hacker chat is a http service that works with websockets. It allows users to create and connect in rooms and change messages.

It is possible to create any interface to communicate with it, web, mobile, desktop, etc.

The terminal client allows you to connect to any hackerchat server, directly on the shell.

<p align="center">
  <img alt="Hackerchat Terminal Client" src="https://github.com/redstone-solutions/hackerchat-terminal-client/raw/main/assets/terminal.png" />
</p>

### Installation

To install the client, you'll need to run:

```bash
npm install -g @redstone-solutions/hackerchat-client
```
or...
```bash
yarn global add @redstone-solutions/hackerchat-client
```

### Connecting to a server

For connecting with a server, you'll need to run:

```bash
hackerchat --username YOUR_USERNAME --room ROOM_NAME --hostUri SERVER_URL
```

The hostUri argument is optional. If the host is missing, the client will connect with the global server.

### Closing the chat

If you want to close the chat, double press the "ESC" button.

---
