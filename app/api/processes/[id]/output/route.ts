import { type NextRequest, NextResponse } from "next/server";
import { getTaskOutput } from "@/lib/pueue-exec";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const processId = params.id;
    // Support optional ?lines=50 or shorthand ?l=50 query parameter to control how many log lines we fetch.
    const url = new URL(request.url);
    const linesParam =
      url.searchParams.get("lines") || url.searchParams.get("l");
    const lines = linesParam
      ? Math.max(1, Math.min(1000, parseInt(linesParam, 10) || 50))
      : 50;
    const output = await getTaskOutput(processId, lines);

    return NextResponse.json({
      output,
      processId,
    });
  } catch (error: unknown) {
    console.error(`Error fetching output for process ${params.id}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch output",
        details: message,
      },
      { status: 500 },
    );
  }
}
