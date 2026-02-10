#!/usr/bin/env node

/**
 * Coordinator Agent
 * Orchestrates research tasks by delegating to specialist agents
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const stateManager = require('../shared/state');
const config = require('./config');

const app = express();
app.use(express.json());

// Track available agents
const agents = new Map();

/**
 * Register an agent
 */
function registerAgent(agentInfo) {
  agents.set(agentInfo.name, {
    ...agentInfo,
    lastSeen: Date.now(),
  });
  stateManager.registerAgent(agentInfo.name, agentInfo);
  console.log(`[Coordinator] Registered agent: ${agentInfo.name}`);
}

/**
 * Find agents by capability
 */
function findAgentsByCapability(capability) {
  return Array.from(agents.values()).filter(agent =>
    agent.capabilities && agent.capabilities.includes(capability)
  );
}

/**
 * Decompose research query into subtasks
 */
function decomposeQuery(query, depth) {
  const subtasks = [];

  // Always need research
  subtasks.push({
    type: 'research',
    description: `Gather information about: ${query}`,
    capability: 'search',
    priority: 1,
  });

  // Add summarization for comprehensive queries
  if (depth === 'comprehensive' || depth === 'detailed') {
    subtasks.push({
      type: 'summarize',
      description: 'Summarize research findings',
      capability: 'summarize',
      priority: 2,
      dependsOn: ['research'],
    });
  }

  return subtasks;
}

/**
 * Delegate task to an agent
 */
async function delegateTask(taskId, subtask, agentUrl) {
  try {
    const response = await fetch(`${agentUrl}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        subtask,
      }),
      signal: AbortSignal.timeout(config.taskTimeout),
    });

    if (!response.ok) {
      throw new Error(`Agent returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Coordinator] Failed to delegate task to ${agentUrl}:`, error.message);
    throw error;
  }
}

/**
 * Execute subtasks
 */
async function executeSubtasks(taskId, subtasks) {
  const results = {};

  // Execute tasks by priority
  const sortedSubtasks = [...subtasks].sort((a, b) => a.priority - b.priority);

  for (const subtask of sortedSubtasks) {
    // Check dependencies
    if (subtask.dependsOn) {
      const dependenciesMet = subtask.dependsOn.every(dep => results[dep]);
      if (!dependenciesMet) {
        console.log(`[Coordinator] Skipping ${subtask.type} - dependencies not met`);
        continue;
      }
    }

    // Find capable agent
    const capableAgents = findAgentsByCapability(subtask.capability);
    if (capableAgents.length === 0) {
      console.error(`[Coordinator] No agent found for capability: ${subtask.capability}`);
      stateManager.updateSubtask(taskId, subtask.id, 'failed', {
        error: 'No capable agent available',
      });
      continue;
    }

    // Use first available agent (can be improved with load balancing)
    const agent = capableAgents[0];
    console.log(`[Coordinator] Delegating ${subtask.type} to ${agent.name}`);

    stateManager.updateSubtask(taskId, subtask.id, 'in-progress');

    try {
      // Include previous results for dependent tasks
      const taskData = {
        ...subtask,
        previousResults: subtask.dependsOn ? 
          subtask.dependsOn.reduce((acc, dep) => {
            acc[dep] = results[dep];
            return acc;
          }, {}) : {},
      };

      const result = await delegateTask(taskId, taskData, agent.url);
      results[subtask.type] = result;
      stateManager.updateSubtask(taskId, subtask.id, 'completed', result);
      stateManager.storeResult(taskId, agent.name, result);
    } catch (error) {
      console.error(`[Coordinator] Task ${subtask.type} failed:`, error.message);
      stateManager.updateSubtask(taskId, subtask.id, 'failed', {
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * POST /research - Submit research query
 */
app.post('/research', async (req, res) => {
  try {
    const { query, depth = 'basic' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Create task
    const taskId = uuidv4();
    stateManager.createTask(taskId, {
      query,
      depth,
      type: 'research',
    });

    console.log(`[Coordinator] New research task: ${taskId}`);
    console.log(`[Coordinator] Query: ${query}`);

    // Decompose into subtasks
    const subtasks = decomposeQuery(query, depth);
    subtasks.forEach(subtask => {
      stateManager.addSubtask(taskId, subtask);
    });

    // Update task status
    stateManager.updateTask(taskId, 'in-progress');

    // Execute subtasks
    const results = await executeSubtasks(taskId, 
      stateManager.getTask(taskId).subtasks
    );

    // Aggregate results
    const report = {
      taskId,
      query,
      depth,
      completedAt: new Date().toISOString(),
      findings: results.research || {},
      summary: results.summarize || null,
    };

    stateManager.updateTask(taskId, 'completed', { report });

    res.json({
      success: true,
      taskId,
      report,
    });
  } catch (error) {
    console.error('[Coordinator] Error processing research:', error);
    res.status(500).json({
      error: 'Failed to process research query',
      message: error.message,
    });
  }
});

/**
 * GET /task/:taskId - Get task status
 */
app.get('/task/:taskId', (req, res) => {
  const task = stateManager.getTask(req.params.taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

/**
 * POST /agent/register - Register an agent
 */
app.post('/agent/register', (req, res) => {
  try {
    const { name, url, capabilities } = req.body;

    if (!name || !url || !capabilities) {
      return res.status(400).json({
        error: 'name, url, and capabilities are required',
      });
    }

    registerAgent({ name, url, capabilities });

    res.json({
      success: true,
      message: `Agent ${name} registered successfully`,
    });
  } catch (error) {
    console.error('[Coordinator] Error registering agent:', error);
    res.status(500).json({
      error: 'Failed to register agent',
      message: error.message,
    });
  }
});

/**
 * GET /agents - List registered agents
 */
app.get('/agents', (req, res) => {
  res.json({
    agents: Array.from(agents.values()),
    online: stateManager.getOnlineAgents(),
  });
});

/**
 * GET /stats - Get system statistics
 */
app.get('/stats', (req, res) => {
  res.json(stateManager.getStats());
});

/**
 * GET /health - Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    agents: agents.size,
  });
});

// Start server
const PORT = config.port || 4000;
app.listen(PORT, () => {
  console.log(`[Coordinator] Listening on port ${PORT}`);
  console.log(`[Coordinator] Server URL: ${config.serverUrl}`);
  console.log(`[Coordinator] Waiting for agents to register...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Coordinator] Shutting down gracefully...');
  process.exit(0);
});
