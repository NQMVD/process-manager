# Pueue Process Termination Guide

## Three-Stage Graceful Shutdown

### 1. Send SIGINT (Ctrl+C equivalent)

**Option A: Using kill command**
```bash
pueue kill --signal sigint <task_id>
```

**Option B: Using send command (alternative)**
```bash
pueue send <task_id> $'\x03'
```

Both send interrupt signal like pressing Ctrl+C. Most interactive programs handle this gracefully.

### 2. Send SIGTERM (if SIGINT didn't work)
```bash
pueue kill --signal sigterm <task_id>
```
Formal termination request. Allows processes to clean up and save state.

### 3. Force kill with SIGKILL (last resort)
```bash
pueue kill <task_id>
```
Immediate termination that cannot be ignored. Current Pueue default.