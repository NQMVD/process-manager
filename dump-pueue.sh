#!/usr/bin/env bash

# This script runs 'pueue status --json' to get the output, then recreates the
# corresponding 'pueue add' commands for each task, including options for working
# directory, label, and group where applicable. Outputs the commands to both stdout and a
# timestamped file.

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
FILE="pueue_add_commands_${TIMESTAMP}.txt"

JSON_OUTPUT=$(pueue status --json)
jq -r '
.tasks | to_entries[] | .value as $task |
( if ($task.command | type) == "array" then $task.command | join(" ") else $task.command end ) as $cmdline |
"pueue add" as $base |
( if $task.path? then " --working-directory \"\($task.path)\"" else "" end ) as $workdiropt |
( if $task.label? then " --label \"\($task.label)\"" else "" end ) as $labelopt |
( if $task.group? and $task.group != "default" then " --group \"\($task.group)\"" else "" end ) as $groupopt |
$base + $workdiropt + $labelopt + $groupopt + " \"" + $cmdline + "\""
' <<< "$JSON_OUTPUT" | tee "$FILE"

echo "Commands written to stdout and to file: $FILE"