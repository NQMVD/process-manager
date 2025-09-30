// Utility for executing Pueue commands with JSON parsing and error handling.
// This file is intended to be used from Next.js route handlers (server side only).
// It uses child_process. Do NOT import into client components.

import { spawn } from "child_process";

// Allow overriding the binary path (e.g. /usr/local/bin/pueue)
const PUEUE_BIN = process.env.PUEUE_BIN || "pueue";

export interface PueueTaskResult {
  success: boolean;
  started: string | null;
  finished: string | null;
  exit_code: number | null;
  failed: boolean;
}

export interface PueueTask {
  id: number;
  command: string;
  path: string;
  status: string;
  label?: string;
  group?: string;
  start?: string | null;
  end?: string | null;
  dependencies?: number[];
  result?: PueueTaskResult;
}

export interface RawPueueStatus {
  version?: string;
  tasks: Record<string, PueueTask>;
  groups?: Record<string, unknown>;
  settings?: unknown;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  failed: boolean;
}

export class PueueExecError extends Error {
  public readonly result: ExecResult;
  public readonly args: string[];
  constructor(message: string, args: string[], result: ExecResult) {
    super(message);
    this.name = "PueueExecError";
    this.result = result;
    this.args = args;
  }
}

export interface RunPueueOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  cwd?: string;
  env?: Record<string, string | undefined>;
  allowNonZeroExit?: boolean;
}

/**
 * Low-level runner for the pueue binary.
 */
export function runPueue(
  args: string[],
  options: RunPueueOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const {
      timeoutMs = 15000,
      abortSignal,
      cwd = process.cwd(),
      env = {},
      allowNonZeroExit = false,
    } = options;

    const child = spawn(PUEUE_BIN, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;
    let timeout: NodeJS.Timeout | null = null;

    const finalize = (exitCode: number | null) => {
      if (finished) return;
      finished = true;
      if (timeout) clearTimeout(timeout);
      const result: ExecResult = {
        stdout,
        stderr,
        exitCode,
        failed: exitCode !== 0 && exitCode !== null,
      };
      if (result.failed && !allowNonZeroExit) {
        return reject(
          new PueueExecError(
            `pueue ${args.join(" ")} failed with code ${exitCode}`,
            args,
            result,
          ),
        );
      }
      resolve(result);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      if (finished) return;
      if (timeout) clearTimeout(timeout);
      reject(
        new PueueExecError(
          `Failed to start pueue process: ${err.message}`,
          args,
          { stdout, stderr: err.message, exitCode: null, failed: true },
        ),
      );
    });

    child.on("close", (code) => finalize(code));

    if (timeoutMs > 0) {
      timeout = setTimeout(() => {
        if (finished) return;
        child.kill("SIGKILL");
        reject(
          new PueueExecError(
            `pueue ${args.join(" ")} timed out after ${timeoutMs}ms`,
            args,
            { stdout, stderr, exitCode: null, failed: true },
          ),
        );
      }, timeoutMs);
    }

    if (abortSignal) {
      abortSignal.addEventListener(
        "abort",
        () => {
          if (finished) return;
          child.kill("SIGKILL");
          reject(
            new PueueExecError(`pueue ${args.join(" ")} aborted`, args, {
              stdout,
              stderr,
              exitCode: null,
              failed: true,
            }),
          );
        },
        { once: true },
      );
    }
  });
}

// ---- High level helpers --------------------------------------------------

export interface NormalizedProcess {
  id: string;
  name: string;
  command: string;
  status:
    | "running"
    | "completed"
    | "killed"
    | "failed"
    | "paused"
    | "queued"
    | "stashed";
  duration: string;
  exitCode: number | null;
  output: string;
  startTime?: string;
  endTime?: string;
  group?: string;
}

function formatDuration(start?: string | null, end?: string | null): string {
  if (!start) return "0s";
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function normalizeStatus(raw: unknown): NormalizedProcess["status"] {
  // Pueue may return either a plain string (legacy) or an enum-like object
  // e.g. { Running: {...} } or { Queued: {...} }.
  let key: string | undefined;
  if (typeof raw === "string") {
    key = raw;
  } else if (raw && typeof raw === "object") {
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length === 1) {
      key = keys[0];
    }
  }
  if (!key) return "queued";
  const lower = key.toLowerCase();
  switch (lower) {
    case "running":
    case "queued":
    case "stashed":
    case "paused":
      return lower as NormalizedProcess["status"];
    case "done":
    case "finished":
    case "success":
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "killed":
    case "killing":
      return "killed";
    default:
      return "queued";
  }
}

export interface GetStatusResult {
  processes: Record<string, NormalizedProcess>;
  raw: RawPueueStatus;
}

export async function getStatus(): Promise<GetStatusResult> {
  const { stdout } = await runPueue(["status", "--json"]);
  let raw: RawPueueStatus;
  try {
    raw = JSON.parse(stdout);
  } catch (err: unknown) {
    const e =
      err instanceof Error
        ? err
        : new Error("Unknown error parsing pueue status JSON");
    throw new Error(
      `Failed to parse pueue status JSON: ${e.message}\nRaw:\n${stdout.slice(0, 500)}`,
    );
  }

  const processes: Record<string, NormalizedProcess> = {};
  for (const [id, task] of Object.entries(raw.tasks || {})) {
    // Derive status with additional inspection of the "Done" variant result.
    // Some Pueue versions represent finished tasks as:
    //   status: { "Done": { ..., result: "Success" | "Failed" | "Killed" } }
    // Our previous logic mapped any "Done" to "completed", which caused killed tasks
    // to appear as completed. We correct that here by inspecting the nested result.
    let derivedStatus: NormalizedProcess["status"] = normalizeStatus(
      task.status,
    );
    if (
      task.status &&
      typeof task.status === "object" &&
      "Done" in (task.status as Record<string, unknown>)
    ) {
      const doneObj = (task.status as Record<string, any>).Done;
      if (
        doneObj &&
        typeof doneObj === "object" &&
        typeof doneObj.result === "string"
      ) {
        const r = doneObj.result.toLowerCase();
        if (r === "killed") {
          derivedStatus = "killed";
        } else if (r === "failed") {
          derivedStatus = "failed";
        } else if (r === "success") {
          derivedStatus = "completed";
        }
      }
    }
    processes[id] = {
      id,
      name: task.label || `Task ${id}`,
      command: task.command,
      status: derivedStatus,
      duration: formatDuration(task.start, task.end),
      exitCode: task.result?.exit_code ?? null,
      output: "",
      startTime: task.start || undefined,
      endTime: task.end || undefined,
      group: task.group,
    };
  }

  return { processes, raw };
}

/**
 * Fetch log/output for a specific task id.
 * Uses: pueue log --json <id>
 * The structure for --json log output differs: it's an object keyed by id.
 */
export async function getTaskOutput(
  id: string,
  lines: number = 50,
): Promise<string> {
  // Use -l to request a specific number of log lines (default 50).
  // Newer pueue versions: pueue log --json -l <lines> <id>
  const args = ["log", "--json"];
  if (lines && Number.isFinite(lines) && lines > 0) {
    args.push("-l", String(Math.floor(lines)));
  }
  args.push(id);

  const { stdout } = await runPueue(args);
  if (!stdout.trim()) return "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    // Fallback: return raw if JSON can't parse
    return stdout;
  }
  // Possible shapes:
  // 1) { "<id>": { output: "full combined output ..." , task: {...} } }
  // 2) { "<id>": { log: string[] } }
  // 3) { "<id>": { log: "string" } }
  if (typeof parsed !== "object" || parsed === null) {
    return "";
  }
  const taskEntry = (parsed as Record<string, unknown>)[id];
  if (!taskEntry) return "";
  if (taskEntry && typeof taskEntry === "object") {
    const entryObj = taskEntry as { output?: unknown; log?: string[] | string };
    if (typeof entryObj.output === "string") {
      return entryObj.output.trimEnd();
    }
    if (Array.isArray(entryObj.log)) {
      return entryObj.log.join("\n");
    }
    if (typeof entryObj.log === "string") {
      return entryObj.log;
    }
  }
  return "";
}

/**
 * Execute an action on a task. Keep mapping here to sanitize allowed actions.
 */
export async function executeTaskAction(
  action: string,
  id: string,
): Promise<ExecResult> {
  const map: Record<string, string[]> = {
    start: ["start", id],
    pause: ["pause", id],
    resume: ["start", id], // alias
    restart: ["restart", id],
    kill: ["kill", id],
    terminate: ["kill", "--signal", "SIGTERM", id],
    cancel: ["remove", id],
    remove: ["remove", id],
  };
  const args = map[action];
  if (!args) {
    throw new Error(`Unsupported action: ${action}`);
  }
  return runPueue(args);
}

/**
 * Enqueue a new task.
 * command: the command line string to run
 * options: { group?, label?, immediate? }
 */
export async function enqueueTask(
  command: string,
  options?: { group?: string; label?: string; immediate?: boolean },
): Promise<ExecResult> {
  const args = ["add"];
  if (options?.group) {
    args.push("-g", options.group);
  }
  if (options?.label) {
    args.push("-l", options.label);
  }
  if (options?.immediate) {
    args.push("--start-immediately");
  }
  // The actual shell command
  args.push("--", command);
  return runPueue(args);
}

/**
 * Convenience to get full normalized status with each task's output (one by one).
 * Potentially expensive if there are many tasks; only fetch outputs for active tasks unless forceAll = true.
 */
export async function getStatusWithOutputs(
  forceAll = false,
): Promise<GetStatusResult> {
  const base = await getStatus();
  const toFetch = Object.values(base.processes).filter(
    (p) => forceAll || ["running", "failed", "completed"].includes(p.status),
  );
  await Promise.all(
    toFetch.map(async (p) => {
      try {
        p.output = await getTaskOutput(p.id);
      } catch (err) {
        p.output = `Failed to load output: ${(err as Error).message}`;
      }
    }),
  );
  return base;
}

// For debugging in development (optional). Avoid running in production automatically.
if (
  process.env.NODE_ENV === "development" &&
  process.env.DEBUG_PUEUE_INIT === "1"
) {
  getStatus()
    .then((s) => {
      console.log(
        `[pueue-exec] Loaded ${Object.keys(s.processes).length} tasks.`,
      );
    })
    .catch((e) => {
      console.warn("[pueue-exec] Failed to load initial status:", e.message);
    });
}

const PueueAPIExports = {
  runPueue,
  getStatus,
  getTaskOutput,
  executeTaskAction,
  enqueueTask,
  getStatusWithOutputs,
};

export default PueueAPIExports;
