# Arqitect Dashboard

A real-time monitoring and interaction dashboard for [Arqitect](https://github.com/otomus/arqitect) autonomous AI agents. Visualizes the agent's neural processing, memory, sensory input, and allows you to send tasks and messages.

**Live demo:** [https://otomus.github.io/arqitect-dashboard/](https://otomus.github.io/arqitect-dashboard/)

## Features

- **Real-time brain state visualization** — watch the agent think, act, and respond with an animated neural disc
- **Nerve monitoring** — view all registered nerves (tools/functions), their test status, and detailed specifications
- **Dream stage tracking** — observe background consolidation phases (qualification, finetuning, reconciliation)
- **Floating chat** — send tasks and messages to the agent, view conversation history
- **Event log** — debug with a real-time stream of thoughts, actions, results, and errors with raw payload inspection
- **System metrics** — CPU, memory, uptime, nerve count, and episode tracking
- **Sensory data** — camera frames, speech-to-text results, and sense calibration status

## Getting Started

### Using the hosted version

1. Open [https://otomus.github.io/arqitect-dashboard/](https://otomus.github.io/arqitect-dashboard/)
2. Click the **settings cog** (⚙️) in the top-right corner
3. Enter your Arqitect server address (e.g. `localhost:4000` or `myserver.example.com:4000`)
4. The dashboard will connect via WebSocket and begin streaming data

> **Note:** The dashboard uses `ws://` for localhost connections and `wss://` for remote hosts. Make sure your server supports the appropriate protocol.

### Running locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SERVER_ADDRESS` | Pre-set the server address (skips manual configuration) |

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run check` | Lint + format check + build |

## Architecture

The dashboard connects to an Arqitect agent via WebSocket using the [`@otomus/arqitect-sdk`](https://www.npmjs.com/package/@otomus/arqitect-sdk). It listens to channels for brain events, nerve results, sensory data, system stats, and memory state.

**Tech stack:** React 19, TypeScript, Vite, Zustand, Tailwind CSS, Three.js / React Three Fiber

## License

MIT
