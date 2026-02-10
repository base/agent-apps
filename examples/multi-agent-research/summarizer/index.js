#!/usr/bin/env node

/**
 * Summarizer Agent
 * Condenses research findings into concise summaries
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
 * Generate summary from research findings
 */
function generateSummary(findings) {
  console.log('[Summarizer] Generating summary...');

  if (!findings || !findings.sources) {
    return {
      error: 'No findings to summarize',
    };
  }

  // Extract key information
  const query = findings.query || 'the topic';
  const sourceCount = findings.sources.length;
  const keyPoints = findings.keyPoints || [];

  // Generate executive summary
  const executiveSummary = `Research on ${query} reveals ${keyPoints.length} key insights from ${sourceCount} sources. ` +
    `The findings indicate ${keyPoints[0] || 'significant developments in this area'}.`;

  // Generate detailed summary
  const detailedSummary = {
    overview: executiveSummary,
    keyFindings: keyPoints,
    sourceAnalysis: findings.sources.map(source => ({
      title: source.title,
      mainPoint: source.summary.split('.')[0] + '.',
      relevance: source.relevance,
    })),
    confidence: findings.confidence || 0.8,
    recommendations: [
      'Further research is recommended to explore emerging trends',
      'Cross-reference findings with additional authoritative sources',
      'Monitor ongoing developments in this field',
    ],
  };

  // Generate concise summary
  const conciseSummary = keyPoints.join('. ') + '.';

  return {
    query,
    executive: executiveSummary,
    detailed: detailedSummary,
    concise: conciseSummary,
    wordCount: {
      executive: executiveSummary.split(' ').length,
      concise: conciseSummary.split(' ').length,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * POST /task - Receive and execute summarization task
 */
app.post('/task', async (req, res) => {
  try {
    const { taskId, subtask } = req.body;

    if (!taskId || !subtask) {
      return res.status(400).json({
        error: 'taskId and subtask are required',
      });
    }

    console.log(`[Summarizer] Received task ${taskId}: ${subtask.description}`);

    // Store task
    currentTasks.set(taskId, {
      ...subtask,
      status: 'in-progress',
      startedAt: Date.now(),
    });

    // Get research findings from previous results
    const findings = subtask.previousResults?.research?.findings;

    if (!findings) {
      throw new Error('No research findings provided');
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate summary
    const summary = generateSummary(findings);

    // Update task status
    currentTasks.set(taskId, {
      ...currentTasks.get(taskId),
      status: 'completed',
      completedAt: Date.now(),
      result: summary,
    });

    console.log(`[Summarizer] Completed task ${taskId}`);

    res.json({
      success: true,
      taskId,
      summary,
    });
  } catch (error) {
    console.error('[Summarizer] Error processing task:', error);
    
    if (currentTasks.has(req.body.taskId)) {
      currentTasks.set(req.body.taskId, {
        ...currentTasks.get(req.body.taskId),
        status: 'failed',
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to process summarization task',
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
    console.log(`[Summarizer] Starting ${config.agentName}...`);

    // Authenticate with main server
    console.log('[Summarizer] Authenticating with server...');
    await auth.authenticate();
    isAuthenticated = true;

    // Start HTTP server
    const PORT = config.port || 4002;
    app.listen(PORT, async () => {
      console.log(`[Summarizer] Listening on port ${PORT}`);
      
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
          console.log('[Summarizer] ✓ Registered with coordinator');
        } else {
          console.warn('[Summarizer] Failed to register with coordinator');
        }
      } catch (error) {
        console.warn('[Summarizer] Could not reach coordinator:', error.message);
      }
    });

    // Refresh token periodically
    setInterval(async () => {
      try {
        await auth.getToken();
      } catch (error) {
        console.error('[Summarizer] Token refresh failed:', error.message);
        isAuthenticated = false;
      }
    }, 600000); // Every 10 minutes

  } catch (error) {
    console.error('[Summarizer] Initialization failed:', error);
    process.exit(1);
  }
}

// Start agent
initialize();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Summarizer] Shutting down gracefully...');
  auth.logout();
  process.exit(0);
});
