# Process Manager - Standalone Executable

This is a standalone executable for running the Process Manager locally without needing `next dev`.

# ERROR
ERROR: it builds and starts with next, that means it runs but doesnt work with live data for some reason...

## Usage

### Basic Usage
```bash
# Run on default port (3000)
./process-manager

# Run on custom port
./process-manager 8080

# Show help
./process-manager --help
```

### Features
- ✅ Automatic build if `.next` directory doesn't exist
- ✅ Custom port support
- ✅ Graceful shutdown (SIGINT/SIGTERM)
- ✅ Help documentation
- ✅ No dependency on `next dev`

### Requirements
- Pueue daemon running in the background
- Bun runtime (bundled in the executable)

### How it works
1. If no `.next` directory exists, it automatically builds the Next.js app
2. Starts the production server using `bun run start`
3. Handles graceful shutdown signals
4. Provides helpful logging and error messages

### Development
To rebuild the executable:
```bash
bun build run-server.ts --compile --outfile process-manager
chmod +x process-manager
```