import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Test endpoint doesn't require auth
  return NextResponse.json(
    {
      message: "Agent Framework Test Endpoint",
      timestamp: new Date().toISOString(),
      status: "working",
      endpoints: {
        register: "/api/auth/register",
        join_session: "/api/sessions/join", 
        session_state: "/api/sessions/{id}/state",
        health: "/api/health"
      }
    },
    {
      headers: {
        "X-Agent-Capable": "true"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Validate auth for POST
    const auth = validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();

    return NextResponse.json(
      {
        message: "Test successful",
        agent: {
          id: auth.agent!.id,
          name: auth.agent!.name
        },
        echo: body,
        timestamp: new Date().toISOString()
      },
      {
        headers: {
          "X-Agent-Capable": "true"
        }
      }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }
}