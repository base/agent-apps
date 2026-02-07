import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      framework: "agent-first",
      version: "1.0.0"
    },
    {
      headers: {
        "X-Agent-Capable": "true",
      },
    }
  );
}