# Multi-Agent Research System Architecture

## System Overview

The multi-agent research system demonstrates a practical implementation of collaborative AI agents using the Agent App Framework. The architecture follows a coordinator-worker pattern where specialized agents work together to accomplish complex research tasks.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User / Client                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP POST /research
                         │ { query, depth }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Coordinator Agent (Port 4000)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Task Decomposition                                 │   │
│  │  - Analyzes query                                   │   │
│  │  - Creates subtasks                                 │   │
│  │  - Determines dependencies                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Agent Registry                                     │   │
│  │  - Tracks available agents                          │   │
│  │  - Maps capabilities                                │   │
│  │  - Monitors health                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Task Orchestration                                 │   │
│  │  - Delegates to specialists                         │   │
│  │  - Manages dependencies                             │   │
│  │  - Aggregates results                               │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────┬───────────────────────┘
               │                      │
               │                      │
    ┌──────────▼─────────┐  ┌────────▼──────────┐
    │  Researcher Agent  │  │ Summarizer Agent  │
    │   (Port 4001)      │  │   (Port 4002)     │
    │                    │  │                   │
    │  Capabilities:     │  │  Capabilities:    │
    │  - search          │  │  - summarize      │
    │  - validate        │  │  - condense       │
    │  - extract         │  │  - format         │
    └──────────┬─────────┘  └────────┬──────────┘
               │                     │
               └──────────┬──────────┘
                          │
                          │ fishnet-auth
                          │
               ┌──────────▼──────────┐
               │  Agent App Server   │
               │   (Port 3000)       │
               │                     │
               │  - Authentication   │
               │  - API Endpoints    │
               │  - Skill Discovery  │
               └─────────────────────┘
```

## Authentication Flow

```
┌──────────┐                    ┌──────────┐
│  Agent   │                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │ GET /api/agent-auth?name=X    │
     │──────────────────────────────>│
     │                               │
     │ { tasks: [...] }              │
     │<──────────────────────────────│
     │                               │
     │ [Agent solves tasks]          │
     │                               │
     │ POST /api/agent-auth          │
     │ { solutions: [...] }          │
     │──────────────────────────────>│
     │                               │
     │ { token, expiresIn }          │
     │<──────────────────────────────│
     │                               │
     │ [Agent uses token for API]    │
     │                               │
```

## Task Execution Flow

```
1. Query Submission
   User → Coordinator: POST /research
   
2. Task Creation
   Coordinator creates task with unique ID
   
3. Task Decomposition
   Coordinator breaks query into subtasks:
   - Research subtask (priority 1)
   - Summarize subtask (priority 2, depends on research)
   
4. Agent Discovery
   Coordinator finds agents by capability:
   - search → ResearcherAgent
   - summarize → SummarizerAgent
   
5. Task Delegation
   Coordinator → Researcher: POST /task
   {
     taskId: "uuid",
     subtask: {
       type: "research",
       description: "Gather information about: ...",
       capability: "search"
     }
   }
   
6. Research Execution
   Researcher conducts research
   Researcher → Coordinator: { findings }
   
7. Dependent Task Execution
   Coordinator → Summarizer: POST /task
   {
     taskId: "uuid",
     subtask: {
       type: "summarize",
       previousResults: { research: { findings } }
     }
   }
   
8. Summary Generation
   Summarizer processes findings
   Summarizer → Coordinator: { summary }
   
9. Result Aggregation
   Coordinator combines all results
   
10. Response Delivery
    Coordinator → User: { report }
```

## State Management

### Shared State Structure

```javascript
{
  tasks: Map {
    "task-id": {
      id: "task-id",
      status: "in-progress",
      query: "...",
      depth: "comprehensive",
      createdAt: timestamp,
      updatedAt: timestamp,
      subtasks: [
        {
          id: "task-id-0",
          type: "research",
          status: "completed",
          result: {...}
        },
        {
          id: "task-id-1",
          type: "summarize",
          status: "in-progress"
        }
      ],
      results: {
        "ResearcherAgent": {
          data: {...},
          timestamp: ...
        }
      }
    }
  },
  
  agentStatus: Map {
    "ResearcherAgent": {
      name: "ResearcherAgent",
      status: "online",
      lastSeen: timestamp,
      capabilities: ["search", "validate", "extract"]
    }
  }
}
```

## Communication Patterns

### Agent-to-Server (fishnet-auth)
- **Protocol**: HTTP/HTTPS
- **Authentication**: fishnet-auth (reasoning tasks)
- **Token**: JWT Bearer token
- **Refresh**: Automatic before expiry

### Coordinator-to-Agent (Task Delegation)
- **Protocol**: HTTP REST
- **Method**: POST /task
- **Timeout**: 30 seconds (configurable)
- **Retry**: 3 attempts with exponential backoff

### Agent-to-Coordinator (Registration)
- **Protocol**: HTTP REST
- **Method**: POST /agent/register
- **Heartbeat**: Implicit via task execution

## Scalability Considerations

### Horizontal Scaling

```
                    ┌──────────────┐
                    │ Load Balancer│
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
   │Researcher│      │Researcher│      │Researcher│
   │Instance 1│      │Instance 2│      │Instance 3│
   └──────────┘      └──────────┘      └──────────┘
```

### Message Queue Integration

For production deployments, replace direct HTTP calls with message queues:

```
Coordinator → [Task Queue] → Workers
Workers → [Result Queue] → Coordinator
```

Benefits:
- Decoupling
- Retry handling
- Load balancing
- Fault tolerance

## Security Architecture

### Authentication Layers

1. **Agent Authentication**: fishnet-auth reasoning tasks
2. **Inter-Agent Communication**: Bearer tokens
3. **API Endpoints**: Rate limiting, input validation

### Data Flow Security

```
User Request → HTTPS → Coordinator
Coordinator → Internal Network → Agents
Agents → HTTPS → Main Server (auth)
```

### Security Best Practices

- Use HTTPS for all external communication
- Implement request signing for agent-to-agent calls
- Validate all inputs
- Rate limit API endpoints
- Rotate authentication tokens
- Log all agent interactions
- Implement circuit breakers

## Monitoring & Observability

### Key Metrics

1. **Task Metrics**
   - Task completion rate
   - Average task duration
   - Failed task percentage
   - Queue depth

2. **Agent Metrics**
   - Agent availability
   - Response time
   - Error rate
   - Active task count

3. **System Metrics**
   - Total throughput
   - Resource utilization
   - Authentication success rate

### Logging Strategy

```
[Timestamp] [Component] [Level] Message
2026-02-10 10:00:00 [Coordinator] INFO Task created: uuid
2026-02-10 10:00:01 [Researcher] INFO Received task: uuid
2026-02-10 10:00:05 [Researcher] INFO Completed task: uuid
```

## Extension Points

### Adding New Agent Types

1. Create agent directory
2. Implement agent interface
3. Define capabilities
4. Register with coordinator
5. Update documentation

### Custom Task Types

1. Define task schema
2. Implement decomposition logic
3. Map to agent capabilities
4. Add result aggregation

### External Integrations

- Real API integrations (search, data sources)
- Database persistence (PostgreSQL, MongoDB)
- Caching layer (Redis)
- Message queues (RabbitMQ, Kafka)
- Monitoring (Prometheus, Grafana)

## Deployment Architecture

### Development

```
localhost:3000 → Main Server
localhost:4000 → Coordinator
localhost:4001 → Researcher
localhost:4002 → Summarizer
```

### Production

```
┌─────────────────────────────────────┐
│         Load Balancer / CDN         │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌────▼────┐
│ Main   │          │ Coord   │
│ Server │          │ Cluster │
│ Cluster│          └────┬────┘
└────────┘               │
                    ┌────┴────┐
                    │         │
              ┌─────▼──┐  ┌──▼──────┐
              │Research│  │Summarize│
              │Cluster │  │ Cluster │
              └────────┘  └─────────┘
```

### Infrastructure Requirements

- **Main Server**: 2 vCPU, 4GB RAM
- **Coordinator**: 2 vCPU, 4GB RAM
- **Each Agent**: 1 vCPU, 2GB RAM
- **Database**: PostgreSQL or MongoDB
- **Cache**: Redis
- **Message Queue**: RabbitMQ or Kafka (optional)

## Performance Optimization

### Caching Strategy

- Cache agent discovery results
- Cache authentication tokens
- Cache frequently accessed research results

### Parallel Execution

- Execute independent subtasks in parallel
- Use worker pools for agent instances
- Implement connection pooling

### Resource Management

- Limit concurrent tasks per agent
- Implement backpressure mechanisms
- Use timeout and circuit breakers

## Fault Tolerance

### Failure Scenarios

1. **Agent Failure**: Retry with different agent instance
2. **Network Failure**: Exponential backoff retry
3. **Timeout**: Mark subtask as failed, continue with others
4. **Authentication Failure**: Re-authenticate and retry

### Recovery Strategies

- Automatic task retry
- Fallback to alternative agents
- Graceful degradation
- State persistence for recovery

## Future Enhancements

1. **Dynamic Agent Discovery**: Service registry (Consul, etcd)
2. **Advanced Orchestration**: Workflow engine
3. **Machine Learning**: Agent selection optimization
4. **Real-time Updates**: WebSocket notifications
5. **Agent Marketplace**: Public agent registry
6. **Capability Negotiation**: Dynamic capability matching
7. **Cost Optimization**: Agent usage analytics
