/**
 * Server-Sent Events endpoint for streaming (near) real-time output
 * of a Pueue task. This polls pueue periodically and only sends
 * incremental lines to the client.
 *
 * URL pattern: /api/processes/:id/stream
 * Optional query params:
 *   interval   - poll interval in ms (default 1000, min 250, max 5000)
 *   lines      - max number of lines to request each poll (default 200)
 *   initial    - whether to send the existing buffer immediately ("1" | "0", default "1")
 *
 * Client example:
 *   const es = new EventSource(`/api/processes/1/stream?interval=1000&lines=300`)
 *   es.onmessage = (e) => {
 *     const payload = JSON.parse(e.data) // { append: "new text ..." }
 *     // Append payload.append to your terminal buffer
 *   }
 *   es.addEventListener('reset', () => { // handle truncation })
 *   es.addEventListener('error', (e) => console.error('stream error', e))
 *
 * Notes:
 * - This is a polling-based incremental stream. Pueue doesn't (yet) provide a
 *   native follow JSON stream via CLI; so we re-fetch output and diff.
 * - If the log shrinks (rotation/truncation), we emit a 'reset' event and resend
 *   the full current buffer as an 'append'.
 * - Uses Node runtime (child_process).
 */

import { getTaskOutput } from "@/lib/pueue-exec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StreamConfig {
  interval: number;
  lines: number;
  sendInitial: boolean;
}

function parseConfig(url: URL): StreamConfig {
  const intervalRaw = parseInt(url.searchParams.get("interval") || "1000", 10);
  const linesRaw = parseInt(url.searchParams.get("lines") || "200", 10);
  const initialRaw = url.searchParams.get("initial");
  return {
    interval: Math.min(
      5000,
      Math.max(250, isFinite(intervalRaw) ? intervalRaw : 1000),
    ),
    lines: Math.min(2000, Math.max(10, isFinite(linesRaw) ? linesRaw : 200)),
    sendInitial: initialRaw === null ? true : initialRaw === "1",
  };
}

function sseEvent(name: string | null, data: unknown): string {
  const json = JSON.stringify(data);
  if (name) {
    return `event: ${name}\ndata: ${json}\n\n`;
  }
  return `data: ${json}\n\n`;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const controller = new AbortController();
  const upstreamSignal = request.signal;

  const url = new URL(request.url);
  const taskId = params.id;
  const { interval, lines, sendInitial } = parseConfig(url);

  const stream = new ReadableStream({
    start: async (streamController) => {
      const encoder = new TextEncoder();

      const send = (chunk: string) => {
        streamController.enqueue(encoder.encode(chunk));
      };

      // Helper: safe fetch output
      const fetchOutput = async (): Promise<string> => {
        try {
          return await getTaskOutput(taskId, lines);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          send(sseEvent("error", { message: msg }));
          return "";
        }
      };

      send(
        `: Pueue task output stream started\n` +
          `: interval=${interval}ms lines=${lines} task=${taskId}\n\n`,
      );

      let lastLines: string[] = [];
      let lastLength = 0;
      let first = true;

      if (sendInitial) {
        const initial = await fetchOutput();
        if (upstreamSignal.aborted) {
          streamController.close();
          return;
        }
        const split = initial.length ? initial.split(/\r?\n/) : [];
        lastLines = split;
        lastLength = split.length;
        if (split.length) {
          send(
            sseEvent(null, {
              append: split.join("\n") + "\n",
              full: true,
              taskId,
            }),
          );
        } else {
          // Send an empty init to let clients know stream is ready
          send(sseEvent("init", { empty: true, taskId }));
        }
      }

      const tick = async () => {
        if (upstreamSignal.aborted || controller.signal.aborted) return;
        const current = await fetchOutput();
        if (upstreamSignal.aborted || controller.signal.aborted) return;

        const split = current.length ? current.split(/\r?\n/) : [];
        // Remove possible trailing empty line artifact
        if (split.length && split[split.length - 1] === "") {
          split.pop();
        }

        if (first) {
          first = false;
          if (!sendInitial && split.length) {
            lastLines = split;
            lastLength = split.length;
          }
        } else {
          if (split.length < lastLength) {
            // Truncated (rotation or restart)
            send(
              sseEvent("reset", {
                reason: "truncated",
                previous: lastLength,
                current: split.length,
                taskId,
              }),
            );
            if (split.length) {
              send(
                sseEvent(null, {
                  append: split.join("\n") + "\n",
                  full: true,
                  taskId,
                }),
              );
            }
            lastLines = split;
            lastLength = split.length;
          } else if (split.length > lastLength) {
            const newLines = split.slice(lastLength);
            if (newLines.length) {
              send(
                sseEvent(null, {
                  append: newLines.join("\n") + "\n",
                  count: newLines.length,
                  taskId,
                }),
              );
              lastLines = split;
              lastLength = split.length;
            }
          }
        }
      };

      const intervalHandle = setInterval(tick, interval);

      // Run first tick immediately if we didn't send initial (so we don't wait full interval)
      if (!sendInitial) {
        tick().catch((e) =>
          send(
            sseEvent("error", {
              message: e instanceof Error ? e.message : String(e),
            }),
          ),
        );
      }

      const abortHandler = () => {
        clearInterval(intervalHandle);
        send(sseEvent("close", { reason: "client_abort", taskId }));
        streamController.close();
      };
      upstreamSignal.addEventListener("abort", abortHandler);
      controller.signal.addEventListener("abort", abortHandler);
    },
    cancel: () => {
      controller.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx buffering hint
    },
  });
}
