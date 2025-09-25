import { NextResponse } from "next/server";
import { runPueue } from "@/lib/pueue-exec";

/**
 * POST /api/processes/clear
 *
 * Clears finished tasks from the Pueue queue.
 *
 * Ways to specify mode:
 *   1. Query param:   /api/processes/clear?mode=successful-only
 *   2. JSON body:     { "mode": "successful-only" }
 *
 * Supported modes:
 *   - "successful-only" (clears only successfully finished tasks)
 *   - "all" (default; clears all finished tasks incl. killed/failed/success)
 *
 * Response:
 *   {
 *     success: boolean,
 *     mode: string,
 *     stdout: string,
 *     stderr: string,
 *     exitCode: number | null,
 *     command: string[]
 *   }
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClearMode = "successful-only" | "all";

interface ClearRequestBody {
  mode?: ClearMode;
}

function normalizeMode(raw: unknown): ClearMode {
  if (raw === "successful-only") return "successful-only";
  return "all";
}

export async function POST(request: Request) {
  try {
    // Prefer JSON body, fallback to query param
    let bodyMode: unknown;
    try {
      if (request.headers.get("content-type")?.includes("application/json")) {
        const data = (await request.json()) as ClearRequestBody;
        bodyMode = data.mode;
      }
    } catch {
      // Ignore body parse errors (e.g. empty body)
    }

    const url = new URL(request.url);
    const queryMode = url.searchParams.get("mode") || undefined;
    const mode: ClearMode = normalizeMode(bodyMode ?? queryMode);

    const args =
      mode === "successful-only"
        ? ["clear", "--successful-only"]
        : ["clear"];

    const result = await runPueue(args, { allowNonZeroExit: true });

    const success = !result.failed;

    return NextResponse.json(
      {
        success,
        mode,
        command: ["pueue", ...args],
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
        exitCode: result.exitCode,
      },
      { status: success ? 200 : 500 },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error clearing tasks";
    return NextResponse.json(
      {
        success: false,
        mode: null,
        error: message,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Use POST to clear tasks. Optionally provide mode via body {\"mode\":\"successful-only\"} or ?mode=successful-only",
    },
    { status: 405 },
  );
}
