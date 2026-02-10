#!/usr/bin/env node

/**
 * Researcher Agent
 * Gathers information for research queries
 */

const express = require('express');
const AgentAuth = require('../shared/auth');
const config = require('./config');

const app = express();
app.use(express.json());

// Initialize authentication
const auth = new AgentAuth(config.serverUrl, config.agentName);

// Agent state
let isAuthenticated = false;
let currentTasks = new Map();

/**
 * Simulate research (replace with real API calls in production)
 */
async function conductResearch(query) {
  console.log(`[Researcher] Conducting research on: ${query}`);

  // Simulate research delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulated research results
  const findings = {
    query,
    sources: [
      {
        title: `Understanding ${query}`,
        url: 'https://example.com/article1',
        summary: `This article provides an overview of ${query}, covering key concepts and recent developments.`,
        relevance: 0.95,
      },
      {
        title: `Latest Developments in ${query}`,
        url: 'https://example.com/article2',
        summary: `Recent advancements and breakthrough research in the field of ${query}.`,
        relevance: 0.88,
      },
      {
        title: `${query}: A Comprehensive Guide`,
        url: 'https://example.com/article3',
        summary: `An in-depth guide covering all aspects of ${query} with practical examples.`,
        relevance: 0.82,
      },
    ],
    keyPoints: [
      `${query} is an evolving field with significant recent progress`,
      'Multiple approaches and methodologies are being explored',
      'Practical applications are expanding rapidly',
    ],
    confidence: 0.85,
    timestamp: new Date().toISOString(),
  };

  return findings;
}

/**
 * POST /task - Receive and execute research task
 */
app.post('/task', async (req, res) => {
  try {
    const { taskId, subtask } = req.body;

    if (!taskId || !subtask) {
      return res.status(400).json({
        error: 'taskId and subtask are required',
      });
    }

    console.log(`[Researcher] Received task ${taskId}: ${subtask.description}`);

    // Store task
    currentTasks.set(taskId, {
      ...subtask,
      status: 'in-progress',
      startedAt: Date.now(),
    });

    // Extract query from description or use previous results
    const query = subtask.query || 
                 subtask.description.replace('Gather information about: ', '');

    // Conduct research
    const findings = await conductResearch(query);

    // Update task status
    currentTasks.set(taskId, {
      ...currentTasks.get(taskId),
      status: 'completed',
      completedAt: Date.now(),
      result: findings,
    });

    console.log(`[Researcher] Completed task ${taskId}`);

    res.json({
      success: true,
      taskId,
      findings,
    });
  } catch (error) {
    console.error('[Researcher] Error processing task:', error);
    
    if (currentTasks.has(req.body.taskId)) {
      currentTasks.set(req.body.taskId, {
        ...currentTasks.get(req.body.taskId),
        status: 'failed',
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to process research task',
      message: error.message,
    });
  }
});

/**
 * GET /task/:taskId - Get task status
 */
app.get('/task/:taskId', (req, res) => {
  const task = currentTasks.get(req.params.taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

/**
 * GET /capabilities - Return agent capabilities
 */
app.get('/capabilities', (req, res) => {
  res.json({
    name: config.agentName,
    capabilities: config.capabilities,
    status: isAuthenticated ? 'authenticated' : 'unauthenticated',
    activeTasks: currentTasks.size,
  });
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    authenticated: isAuthenticated,
    uptime: process.uptime(),
    activeTasks: currentTasks.size,
  });
});

/**
 * Initialize agent
 */
async function initialize() {
  try {
    console.log(`[Researcher] Starting ${config.agentName}...`);

    // Authenticate with main server
    console.log('[Researcher] Authenticating with server...');
    await auth.authenticate();
    isAuthenticated = true;

    // Start HTTP server
    const PORT = config.port || 4001;
    app.listen(PORT, async () => {
      console.log(`[Researcher] Listening on port ${PORT}`);
      
      // Register with coordinator
      try {
        const response = await fetch(`${config.coordinatorUrl}/agent/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: config.agentName,
            url: `http://localhost:${PORT}`,
            capabilities: config.capabilities,
          }),
        });

        if (response.ok) {
          console.log('[Researcher] ✓ Registered with coordinator');
        } else {
          console.warn('[Researcher] Failed to register with coordinator');
        }
      } catch (error) {
        console.warn('[Researcher] Could not reach coordinator:', error.message);
      }
    });

    // Refresh token periodically
    setInterval(async () => {
      try {
        await auth.getToken();
      } catch (error) {
        console.error('[Researcher] Token refresh failed:', error.message);
        isAuthenticated = false;
      }
    }, 600000); // Every 10 minutes

  } catch (error) {
    console.error('[Researcher] Initialization failed:', error);
    process.exit(1);
  }
}

// Start agent
initialize();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Researcher] Shutting down gracefully...');
  auth.logout();
  process.exit(0);
});
