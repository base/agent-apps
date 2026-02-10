# Multi-Agent Research Assistant

A comprehensive example demonstrating multi-agent collaboration using the Agent App Framework. This example shows how multiple AI agents can work together to accomplish complex research tasks through authentication, discovery, and coordinated task execution.

## Overview

This example implements a research assistant system where multiple specialized agents collaborate:

- **Coordinator Agent**: Receives research queries, breaks them into sub-tasks, and orchestrates specialist agents
- **Researcher Agent**: Gathers information from various sources
- **Summarizer Agent**: Condenses findings into concise summaries

Each agent authenticates using fishnet-auth and communicates through a shared API, demonstrating real-world multi-agent patterns.

## Architecture

```
┌─────────────────┐
│  User/Client    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│     Coordinator Agent               │
│  - Receives research query          │
│  - Breaks into sub-tasks            │
│  - Delegates to specialists         │
│  - Aggregates results               │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│  Researcher  │   │ Summarizer   │
│    Agent     │   │    Agent     │
│              │   │              │
│ - Searches   │   │ - Condenses  │
│ - Validates  │   │ - Formats    │
│ - Reports    │   │ - Delivers   │
└──────────────┘   └──────────────┘
       │                  │
       └──────┬───────────┘
              ▼
       ┌──────────────┐
       │ Shared State │
       │   Storage    │
       └──────────────┘
```

## Key Features

### 1. Agent Discovery
Agents discover each other through skill.md endpoints, enabling dynamic collaboration without hardcoded dependencies.

### 2. fishnet-auth Authentication
Each agent authenticates independently using reasoning tasks, proving they are legitimate AI agents.

### 3. Task Delegation
The coordinator agent intelligently distributes work based on agent capabilities and current workload.

### 4. State Synchronization
Shared state management ensures all agents have access to current research progress and findings.

### 5. Error Handling
Robust error handling with retry logic and fallback strategies when agents are unavailable.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or pnpm
- The main agent-apps-experimental project set up

### Setup

1. **Install dependencies** (from project root):
```bash
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env.local
# Set FISHNET_AUTH_SECRET to a strong random string
```

3. **Start the main server**:
```bash
npm run dev
```

4. **Run the coordinator agent**:
```bash
cd examples/multi-agent-research/coordinator
node index.js
```

5. **Run specialist agents** (in separate terminals):
```bash
# Terminal 2: Researcher
cd examples/multi-agent-research/researcher
node index.js

# Terminal 3: Summarizer
cd examples/multi-agent-research/summarizer
node index.js
```

### Test the System

Send a research query to the coordinator:

```bash
curl -X POST http://localhost:4000/research \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the latest developments in blockchain scalability?",
    "depth": "comprehensive"
  }'
```

## How It Works

### 1. Query Submission
A user submits a research query to the Coordinator Agent.

### 2. Task Decomposition
The Coordinator analyzes the query and breaks it into sub-tasks:
- Information gathering (→ Researcher)
- Summary generation (→ Summarizer)

### 3. Agent Authentication
Each specialist agent authenticates with the main server using fishnet-auth:
```javascript
// Agent requests challenge
const challenge = await fetch('http://localhost:3000/api/agent-auth?name=ResearcherAgent');

// Agent solves reasoning tasks
const solutions = solveTasks(challenge.tasks);

// Agent submits solutions and receives token
const { token } = await fetch('http://localhost:3000/api/agent-auth', {
  method: 'POST',
  body: JSON.stringify({ solutions })
});
```

### 4. Task Execution
Specialist agents execute their assigned tasks and report results back to the Coordinator.

### 5. Result Aggregation
The Coordinator combines all results and delivers a comprehensive research report.

## Agent Implementations

### Coordinator Agent (`coordinator/index.js`)
- Receives research queries via REST API
- Decomposes queries into actionable sub-tasks
- Discovers available specialist agents
- Delegates tasks and tracks progress
- Aggregates results into final report

### Researcher Agent (`researcher/index.js`)
- Authenticates with fishnet-auth
- Receives research tasks from Coordinator
- Simulates information gathering (can be extended with real APIs)
- Returns structured research findings

### Summarizer Agent (`summarizer/index.js`)
- Authenticates with fishnet-auth
- Receives raw research data
- Generates concise summaries
- Formats output for readability

## Shared Utilities (`shared/`)

### `auth.js`
Handles fishnet-auth authentication flow:
- Challenge request
- Task solving
- Token management
- Token refresh

### `discovery.js`
Agent discovery utilities:
- Fetches skill.md from agents
- Parses agent capabilities
- Maintains agent registry

### `state.js`
Shared state management:
- In-memory state store (can be replaced with Redis/DB)
- State synchronization between agents
- Task status tracking

## Configuration

### Coordinator Agent
```javascript
// coordinator/config.js
module.exports = {
  port: 4000,
  serverUrl: 'http://localhost:3000',
  maxConcurrentTasks: 5,
  taskTimeout: 30000, // 30 seconds
  retryAttempts: 3
};
```

### Specialist Agents
```javascript
// researcher/config.js
module.exports = {
  agentName: 'ResearcherAgent',
  capabilities: ['search', 'validate', 'extract'],
  serverUrl: 'http://localhost:3000',
  coordinatorUrl: 'http://localhost:4000'
};
```

## Extending the Example

### Add New Specialist Agents

1. Create a new directory: `examples/multi-agent-research/your-agent/`
2. Implement the agent following the pattern in `researcher/index.js`
3. Define capabilities in the agent's skill.md
4. Register with the Coordinator

### Integrate Real APIs

Replace simulated research with real API calls:

```javascript
// researcher/sources/web-search.js
async function searchWeb(query) {
  // Integrate with search APIs (Google, Bing, etc.)
  const results = await fetch(`https://api.search.com/query?q=${query}`);
  return results;
}
```

### Add Persistence

Replace in-memory state with a database:

```javascript
// shared/state.js
const Redis = require('redis');
const client = Redis.createClient();

async function saveState(taskId, state) {
  await client.set(`task:${taskId}`, JSON.stringify(state));
}
```

### Implement Agent Registry

Create a service discovery system:

```javascript
// shared/registry.js
class AgentRegistry {
  async register(agentInfo) {
    // Store agent metadata
    // Health check endpoint
    // Capability matching
  }
  
  async findAgents(capability) {
    // Return agents with matching capabilities
  }
}
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# Start all agents
npm run start:all

# Run integration tests
npm run test:integration
```

### Manual Testing
Use the provided test script:
```bash
./test-multi-agent.sh
```

## Production Considerations

### Security
- Use HTTPS for all agent communication
- Implement rate limiting
- Add request signing for agent-to-agent calls
- Validate all inputs

### Scalability
- Deploy agents as separate services
- Use message queues for task distribution
- Implement load balancing
- Add horizontal scaling for specialist agents

### Monitoring
- Track agent health and availability
- Monitor task completion rates
- Log all agent interactions
- Set up alerting for failures

### Reliability
- Implement circuit breakers
- Add retry logic with exponential backoff
- Handle partial failures gracefully
- Maintain agent state across restarts

## Troubleshooting

### Agent Authentication Fails
- Verify FISHNET_AUTH_SECRET is set correctly
- Check that the agent is solving tasks correctly
- Ensure the server is running and accessible

### Coordinator Can't Find Agents
- Verify all agents are running
- Check agent URLs in configuration
- Ensure skill.md endpoints are accessible

### Tasks Timeout
- Increase taskTimeout in coordinator config
- Check agent performance and resource usage
- Verify network connectivity between agents

## Learn More

- [fishnet-auth Documentation](https://github.com/base/fishnet-auth)
- [Agent App Framework](../../README.md)
- [skill.md Specification](https://github.com/base/skill-md-spec)
- [Multi-Agent Systems Best Practices](https://example.com/multi-agent-best-practices)

## Contributing

Contributions are welcome! Areas for improvement:

- Additional specialist agents (fact-checker, translator, etc.)
- Real API integrations
- Enhanced error handling
- Performance optimizations
- More comprehensive tests

## License

MIT - See LICENSE file in the project root
