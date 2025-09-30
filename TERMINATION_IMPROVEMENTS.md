# Process Termination Improvements

## Overview
Implemented a new approach for better termination of tasks based on the three-stage graceful shutdown guide. The system now provides multiple termination methods with increasing levels of force.

## Changes Made

### 1. Backend Changes (`lib/pueue-exec.ts`)
- Added support for signal-based termination:
  - `shutdown`: Uses `pueue kill --signal sigint <id>` (SIGINT - Ctrl+C equivalent)
  - `terminate`: Uses `pueue kill --signal sigterm <id>` (SIGTERM - graceful termination request)
  - `kill`: Uses `pueue kill <id>` (SIGKILL - force kill, unchanged)

### 2. Type System Updates (`hooks/use-process-actions.ts`)
- Updated `ProcessAction` interface to include new actions: `shutdown` and `terminate`

### 3. UI Changes (`components/process-actions.tsx`)
- Added new icons: `Power` (shutdown) and `Zap` (kill)
- Updated running tasks to show 4 termination options:
  1. **Pause** - Pauses the task
  2. **Shutdown** (SIGINT) - Graceful shutdown with Power icon
  3. **Terminate** (SIGTERM) - Formal termination with Square icon  
  4. **Kill** (SIGKILL) - Force kill with Zap icon
  5. **Restart** - Restarts the task
- Updated paused tasks to show Kill option with Zap icon
- Added tooltips for clarity on termination methods

## Termination Hierarchy

The new system provides a three-stage approach to process termination:

1. **SIGINT (Shutdown)** - Most graceful, allows processes to handle interruption like Ctrl+C
2. **SIGTERM (Terminate)** - Formal termination request, allows cleanup and state saving
3. **SIGKILL (Kill)** - Immediate termination that cannot be ignored (last resort)

## Testing

All termination methods were tested successfully:
- ✅ SIGINT graceful shutdown works correctly
- ✅ SIGTERM termination works correctly  
- ✅ SIGKILL force kill works correctly
- ✅ API endpoints respond properly
- ✅ UI displays all buttons with appropriate icons and tooltips
- ✅ Build system passes without errors

## Benefits

- **Better Process Management**: Users can choose the appropriate termination method
- **Graceful Shutdowns**: Processes get a chance to clean up before being forcibly killed
- **Clear UI**: Icons and tooltips make the different termination methods obvious
- **Backward Compatibility**: Existing functionality remains unchanged