
_default:
  just --list
  pueue

add-dummies:
  #!/usr/bin/env bash
  pueue add -- echo "hellow"
  TOKILL=$(pueue add -p -- sleep 5)
  echo $TOKILL
  pueue kill --signal sigint $TOKILL
  TOKILL=$(pueue add -p -- sleep 5)
  echo $TOKILL
  pueue kill --signal sigterm $TOKILL
  pueue add -w "/Users/noah/dev/repos/needs" -- bacon --headless

compile:
 bun build run-server.ts --compile --outfile process-manager
 chmod +x process-manager
