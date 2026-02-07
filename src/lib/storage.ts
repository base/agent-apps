// Shared in-memory storage for demo purposes
// In production, replace with real database

interface Agent {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
}

interface Session {
  id: string;
  agentId: string;
  agentName: string;
  status: "waiting" | "active" | "complete";
  createdAt: string;
  lastActivity: string;
}

class Storage {
  private agents = new Map<string, Agent>();
  private sessions = new Map<string, Session>();

  // Agent methods
  addAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
  }

  findAgentByApiKey(apiKey: string): Agent | undefined {
    return Array.from(this.agents.values()).find(a => a.apiKey === apiKey);
  }

  findAgentByName(name: string): Agent | undefined {
    return Array.from(this.agents.values()).find(a => a.name === name);
  }

  // Session methods
  addSession(session: Session) {
    this.sessions.set(session.id, session);
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  updateSession(id: string, updates: Partial<Session>) {
    const session = this.sessions.get(id);
    if (session) {
      Object.assign(session, updates);
    }
  }
}

// Singleton instance
export const storage = new Storage();