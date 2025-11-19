# Process Manager

Process Manager is a Next.js 14 dashboard for the [Pueue](https://github.com/pueue/pueue) task queue. It lets you watch live task output, enqueue new jobs, and send pause, resume, restart, shutdown, terminate, kill, and remove actions without touching the CLI.

## Features

- **Real-time task list** refreshed every two seconds via SWR.
- **Streaming log viewer** backed by Server-Sent Events (`/api/processes/[id]/stream`) with graceful fallbacks.
- **Full task control** for pausing, resuming, shutting down (SIGINT), terminating (SIGTERM), force killing (SIGKILL), restarting, and removing jobs.
- **Quick start launcher** with common commands and custom command enqueueing.
- **Notification center** for success and error feedback.
- **Server-side Pueue bridge** (`lib/pueue-exec.ts`) that normalizes status JSON and exposes clearing endpoints.

## Architecture Overview

- **Frontend:** App Router-based Next.js UI (`app/`, `components/`) styled with Tailwind CSS 4 and Radix UI primitives.
- **Backend:** Route handlers in `app/api/**` invoke the local `pueue` binary through `child_process` helpers (`runPueue`, `getStatus`, `getTaskOutput`).
- **State & Data Fetching:** SWR hooks (`hooks/use-processes.ts`, `hooks/use-process-actions.ts`) poll REST endpoints and stream logs.
- **Standalone Runner:** `run-server.ts` compiles to a self-contained `process-manager` executable via Bun for production-like usage.

## Prerequisites

1. **Node.js 18.17+** or **Bun 1.1+** (Bun is recommended since the repo ships with `bun.lock`).
2. **Pueue CLI and daemon** must be installed and running (`pueued --daemonize`). Set `PUEUE_BIN` if the binary lives outside `$PATH`.
3. (Optional) **Just** and **Bun** for building the standalone binary or seeding demo tasks (see `justfile`).

## Installation

```bash
# Install dependencies (pick one)
bun install
# or
pnpm install

# Make sure the pueue daemon is active
pueued --daemonize
```

If you need a custom pueue path, export it before running the app:

```bash
export PUEUE_BIN="/usr/local/bin/pueue"
```

## Development Workflow

```bash
# Start the Next.js dev server (hot reload, SSE stream, etc.)
bun run dev
# or
pnpm dev

# Run linting
bun run lint
# or
pnpm lint
```

Once running, open `http://localhost:3000` to view live tasks. Use the “Start New Process” panel to enqueue commands (currently logs to console while the enqueue endpoint is being finalized) and control existing jobs through the action buttons.

## Production Build & Standalone Runner

```bash
# Build static assets
bun run build

# Launch production server
PUEUE_BIN="/usr/local/bin/pueue" bun run start

# Optional: compile the standalone binary defined in run-server.ts
bun run compile
# or manually
bun build run-server.ts --compile --outfile process-manager
chmod +x process-manager
./process-manager 3000
```

The compiled `process-manager` binary auto-builds the app if `.next` is missing, then runs `bun run start` with graceful shutdown handlers.

## API Surface

| Route | Method | Description |
| --- | --- | --- |
| `/api/status` | GET | Returns normalized Pueue task metadata, groups, and daemon settings. |
| `/api/processes/action` | POST | Executes task actions (`start`, `pause`, `restart`, `kill`, `shutdown`, `terminate`, `cancel`, `remove`). |
| `/api/processes/clear` | POST | Clears finished tasks (`mode=all` or `mode=successful-only`). |
| `/api/processes/[id]/output` | GET | Fetches the latest log snapshot for a task. |
| `/api/processes/[id]/stream` | GET | Server-Sent Events stream that pushes incremental log data. |

## Recommended Localhost Alias Tool

For friendlier and HTTPS-ready URLs during development, install [localias](https://github.com/peterldowns/localias). It maps names such as `https://process-manager.test` to local ports, keeps `/etc/hosts` in sync, and auto-generates trusted TLS certificates via Caddy. A typical workflow is:

```bash
brew install peterldowns/tap/localias   # or use go/nix binaries
localias set process-manager.test 3000  # alias to your dev server
localias run                            # proxy requests on 80/443 -> 3000
```

Commit a `.localias.yaml` to your repo to share aliases with teammates, then keep the daemon running (`localias start`/`localias reload`) while you work.

## Troubleshooting

- **No tasks appear:** Ensure `pueued` is running and accessible by the account executing Next.js. Test with `pueue status --json`.
- **`pueue` command not found:** Export `PUEUE_BIN` or update your PATH so the server-side helpers can spawn the binary.
- **SSE stream drops:** The `/api/processes/[id]/stream` endpoint relies on polling; check daemon health and increase the `interval` query parameter if your server is resource constrained.
- **Standalone binary fails to build:** Verify Bun is installed and up to date (`bun --version`).

## Contributing

1. Fork and clone the repository.
2. Install dependencies and run the dev server.
3. Keep runtimes server-only when invoking `lib/pueue-exec` helpers.
4. Submit PRs against the `main` branch.
