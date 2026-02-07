import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingAgent = storage.findAgentByName(name);
    if (existingAgent) {
      return NextResponse.json(
        { error: "Name already taken" },
        { status: 409 }
      );
    }

    // Generate agent
    const agentId = `agent_${uuidv4()}`;
    const apiKey = `sk_test_${uuidv4().replace(/-/g, '')}`;
    
    const agent = {
      id: agentId,
      name,
      apiKey,
      createdAt: new Date().toISOString()
    };

    storage.addAgent(agent);

    return NextResponse.json(
      {
        agentId,
        apiKey,
        message: `Welcome ${name}! Use this API key for all requests.`
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
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }
}