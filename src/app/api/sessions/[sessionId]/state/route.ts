import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";

// Import sessions from join endpoint (in real app this would be database)
const sessions = new Map<string, {
  id: string;
  agentId: string;
  agentName: string;
  status: "waiting" | "active" | "complete";
  createdAt: string;
  lastActivity: string;
}>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    // Validate auth
    const auth = validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { sessionId } = await params;
    const session = sessions.get(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if agent owns this session
    if (session.agentId !== auth.agent!.id) {
      return NextResponse.json(
        { error: "Not your session" },
        { status: 403 }
      );
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();

    return NextResponse.json(
      {
        sessionId: session.id,
        status: session.status,
        state: {
          phase: session.status === "waiting" ? "lobby" : "game",
          playerCount: session.status === "waiting" ? 1 : 2,
          maxPlayers: 2,
          turn: session.status === "active" ? auth.agent!.name : null
        },
        availableActions: session.status === "waiting" 
          ? ["wait", "leave"] 
          : session.status === "active" 
            ? ["make_move", "forfeit"]
            : ["view_result"],
        spectatorUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/watch/${sessionId}`,
        result: session.status === "complete" ? { winner: "demo", reason: "test_complete" } : null
      },
      {
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