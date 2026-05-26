<h1 align="center">Hackerchat Terminal Client</h1>

<p align="center">
  A terminal-based WebSocket chat client built with Node.js and TypeScript.
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D24-brightgreen?logo=node.js&logoColor=white" alt="Node.js version" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-6-blue?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#features">Features</a> ·
  <a href="#prerequisites">Prerequisites</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#running-locally">Running Locally</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#public-test-server">Public Test Server</a> ·
  <a href="#related-projects">Related Projects</a>
</p>

<p align="center">
  <img alt="Hackerchat Terminal Client" src="https://github.com/matheussartori/hackerchat-terminal-client/raw/main/assets/terminal.png" />
</p>

## Overview

Hackerchat Terminal Client is a TUI (terminal user interface) that connects to any [Hackerchat Server](https://github.com/matheussartori/hackerchat-server) instance over WebSockets. It lets you create and join rooms and exchange messages in real time — entirely from the shell.

Because the server is client-agnostic, this client can connect to any Hackerchat Server deployment, whether it is running locally, on a VPS, or at the public test address.

## Features

- Room-based real-time messaging directly in the terminal
- TUI rendered with `blessed` — no browser required
- Coloured output via `chalk`
- Zero-config connection to the public test server
- Full TypeScript source

## Prerequisites

- **Node.js** `>= 24`
- **npm** `>= 10`

## Installation

Install the client globally from npm:

```bash
npm install -g @redstone-solutions/hackerchat-client
```

After installation the `hackerchat` command is available in your shell.

## Running Locally

**1. Clone the repository**

```bash
git clone https://github.com/matheussartori/hackerchat-terminal-client.git
cd hackerchat-terminal-client
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development client**

```bash
npm run dev -- --username YOUR_USERNAME --room ROOM_NAME
```

The `--` separator is required to pass arguments through npm to the underlying script.

**Example — public test server:**

```bash
npm run dev -- --username alice --room general
```

**Example — local Hackerchat Server:**

```bash
npm run dev -- --username alice --room general --hostUri ws://localhost:9898
```

> `tsx` executes TypeScript directly without a build step. Watch mode is intentionally not used because `tsx watch` reads from `stdin` to support manual restarts (Enter key), which conflicts with the `blessed` raw-mode keyboard input and would restart the client on every keystroke.

**Other useful commands**

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` via `tsup` |

## Usage

> The `hackerchat` command below is available after a global install (`npm install -g`). If running locally from source, replace `hackerchat` with `npm run dev --` (see [Running Locally](#running-locally)).

### Connecting to a server

```bash
hackerchat --username YOUR_USERNAME --room ROOM_NAME --hostUri SERVER_URL
```

| Flag | Required | Description |
|---|---|---|
| `--username` | Yes | Display name used in the chat room |
| `--room` | Yes | Room ID to join or create |
| `--hostUri` | No | WebSocket URL of the server. Defaults to the public test server |

**Example — public test server:**

```bash
hackerchat --username alice --room general
```

**Example — local server:**

```bash
hackerchat --username alice --room general --hostUri ws://localhost:9898
```

### Closing the chat

Double-press the **ESC** key to exit.

## Public Test Server

A public instance of Hackerchat Server is available for testing at:

```
ws://hackerchatserver.mattsartori.com.br
```

No setup required — just run the client without `--hostUri` and it will connect automatically.

## Related Projects

- [hackerchat-server](https://github.com/matheussartori/hackerchat-server) — The WebSocket server that powers Hackerchat

## License

[MIT](./LICENSE) © [Matheus Sartori](https://github.com/matheussartori)
