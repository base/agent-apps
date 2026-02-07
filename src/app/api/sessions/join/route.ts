import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Validate auth
    const auth = validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const agent = auth.agent!;
    const sessionId = `session_${uuidv4()}`;
    
    const session = {
      id: sessionId,
      agentId: agent.id,
      agentName: agent.name,
      status: "waiting" as const,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    storage.addSession(session);

    return NextResponse.json(
      {
        sessionId,
        status: "waiting",
        state: {
          phase: "lobby",
          playerCount: 1,
          maxPlayers: 2
        },
        availableActions: ["wait", "leave"],
        spectatorUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/watch/${sessionId}`,
        result: null
      },
      {
        status: 201,
        headers: {
          "X-Agent-Capable": "true"
        }
      }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

