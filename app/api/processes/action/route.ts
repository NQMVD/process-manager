import { type NextRequest, NextResponse } from "next/server";
import { executeTaskAction } from "@/lib/pueue-exec";

export async function POST(request: NextRequest) {
  try {
    const { type, processId } = await request.json();

    if (!type || !processId) {
      return NextResponse.json(
        { error: "Missing type or processId" },
        { status: 400 },
      );
    }

    console.log(
      `[Process Manager] Executing ${type} action on process ${processId}`,
    );

    let execResult;
    try {
      execResult = await executeTaskAction(type, String(processId));
    } catch (err: unknown) {
      console.error(
        `[Process Manager] Action ${type} on ${processId} failed:`,
        err,
      );
      let stdout: string | undefined;
      let stderr: string | undefined;
      if (err && typeof err === "object" && "result" in err) {
        const r = (err as { result?: { stdout?: string; stderr?: string } })
          .result;
        stdout = r?.stdout;
        stderr = r?.stderr;
      }
      const message = err instanceof Error ? err.message : "Execution failed";
      return NextResponse.json(
        {
          success: false,
          action: type,
          processId,
          error: message,
          stdout,
          stderr,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      action: type,
      processId,
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      exitCode: execResult.exitCode,
      message: `Executed ${type} on process ${processId}`,
    });
  } catch (error: unknown) {
    console.error("Error executing process action:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to execute process action", details: message },
      { status: 500 },
    );
  }
}
