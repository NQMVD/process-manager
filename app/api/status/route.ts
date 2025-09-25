import { NextResponse } from "next/server";
import { getStatus } from "@/lib/pueue-exec";

export async function GET() {
  try {
    const { processes, raw } = await getStatus();

    return NextResponse.json({
      processes,
      groups: raw.groups || {},
      settings: raw.settings || {},
    });
  } catch (error: unknown) {
    console.error("Error fetching pueue status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch status", details: message },
      { status: 500 },
    );
  }
}
