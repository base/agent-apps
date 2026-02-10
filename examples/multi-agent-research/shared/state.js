/**
 * Shared state management for multi-agent system
 * In-memory implementation (can be replaced with Redis/DB for production)
 */

class StateManager {
  constructor() {
    this.tasks = new Map();
    this.sessions = new Map();
    this.agentStatus = new Map();
  }

  /**
   * Create a new research task
   * @param {string} taskId - Unique task identifier
   * @param {Object} taskData - Task data
   */
  createTask(taskId, taskData) {
    this.tasks.set(taskId, {
      id: taskId,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...taskData,
      subtasks: [],
      results: {},
    });
  }

  /**
   * Get task by ID
   * @param {string} taskId - Task identifier
   * @returns {Object|null} Task data
   */
  getTask(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * Update task status
   * @param {string} taskId - Task identifier
   * @param {string} status - New status
   * @param {Object} updates - Additional updates
   */
  updateTask(taskId, status, updates = {}) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    this.tasks.set(taskId, {
      ...task,
      status,
      updatedAt: Date.now(),
      ...updates,
    });
  }

  /**
   * Add subtask to a task
   * @param {string} taskId - Parent task ID
   * @param {Object} subtask - Subtask data
   */
  addSubtask(taskId, subtask) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.subtasks.push({
      id: `${taskId}-${task.subtasks.length}`,
      status: 'pending',
      createdAt: Date.now(),
      ...subtask,
    });

    task.updatedAt = Date.now();
  }

  /**
   * Update subtask status
   * @param {string} taskId - Parent task ID
   * @param {string} subtaskId - Subtask ID
   * @param {string} status - New status
   * @param {Object} result - Subtask result
   */
  updateSubtask(taskId, subtaskId, status, result = null) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) {
      throw new Error(`Subtask ${subtaskId} not found`);
    }

    subtask.status = status;
    subtask.updatedAt = Date.now();
    if (result) {
      subtask.result = result;
    }

    task.updatedAt = Date.now();
  }

  /**
   * Store result for a task
   * @param {string} taskId - Task identifier
   * @param {string} agentName - Agent that produced the result
   * @param {*} result - Result data
   */
  storeResult(taskId, agentName, result) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.results[agentName] = {
      data: result,
      timestamp: Date.now(),
    };

    task.updatedAt = Date.now();
  }

  /**
   * Get all results for a task
   * @param {string} taskId - Task identifier
   * @returns {Object} Results by agent name
   */
  getResults(taskId) {
    const task = this.tasks.get(taskId);
    return task ? task.results : {};
  }

  /**
   * Check if all subtasks are complete
   * @param {string} taskId - Task identifier
   * @returns {boolean} True if all subtasks are complete
   */
  areSubtasksComplete(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.subtasks.length === 0) {
      return false;
    }

    return task.subtasks.every(st => 
      st.status === 'completed' || st.status === 'failed'
    );
  }

  /**
   * Create a new session
   * @param {string} sessionId - Session identifier
   * @param {Object} sessionData - Session data
   */
  createSession(sessionId, sessionData) {
    this.sessions.set(sessionId, {
      id: sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...sessionData,
    });
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} Session data
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Update session
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Session updates
   */
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.sessions.set(sessionId, {
      ...session,
      ...updates,
      updatedAt: Date.now(),
    });
  }

  /**
   * Register agent status
   * @param {string} agentName - Agent name
   * @param {Object} status - Agent status
   */
  registerAgent(agentName, status) {
    this.agentStatus.set(agentName, {
      name: agentName,
      status: 'online',
      lastSeen: Date.now(),
      ...status,
    });
  }

  /**
   * Update agent status
   * @param {string} agentName - Agent name
   * @param {Object} updates - Status updates
   */
  updateAgentStatus(agentName, updates) {
    const agent = this.agentStatus.get(agentName);
    if (!agent) {
      this.registerAgent(agentName, updates);
      return;
    }

    this.agentStatus.set(agentName, {
      ...agent,
      ...updates,
      lastSeen: Date.now(),
    });
  }

  /**
   * Get agent status
   * @param {string} agentName - Agent name
   * @returns {Object|null} Agent status
   */
  getAgentStatus(agentName) {
    return this.agentStatus.get(agentName) || null;
  }

  /**
   * Get all online agents
   * @returns {Array} List of online agents
   */
  getOnlineAgents() {
    const now = Date.now();
    const timeout = 60000; // 1 minute

    return Array.from(this.agentStatus.values()).filter(
      agent => agent.status === 'online' && (now - agent.lastSeen) < timeout
    );
  }

  /**
   * Clean up old tasks and sessions
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanup(maxAge = 3600000) { // Default: 1 hour
    const now = Date.now();

    // Clean up old tasks
    for (const [taskId, task] of this.tasks.entries()) {
      if (now - task.updatedAt > maxAge && 
          (task.status === 'completed' || task.status === 'failed')) {
        this.tasks.delete(taskId);
      }
    }

    // Clean up old sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.updatedAt > maxAge) {
        this.sessions.delete(sessionId);
      }
    }

    // Mark stale agents as offline
    for (const [agentName, agent] of this.agentStatus.entries()) {
      if (now - agent.lastSeen > 60000) { // 1 minute
        agent.status = 'offline';
      }
    }
  }

  /**
   * Get statistics
   * @returns {Object} System statistics
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    const agents = Array.from(this.agentStatus.values());

    return {
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
      },
      sessions: {
        total: this.sessions.size,
      },
      agents: {
        total: agents.length,
        online: agents.filter(a => a.status === 'online').length,
        offline: agents.filter(a => a.status === 'offline').length,
      },
    };
  }
}

// Singleton instance
const stateManager = new StateManager();

// Auto cleanup every 5 minutes
setInterval(() => {
  stateManager.cleanup();
}, 300000);

module.exports = stateManager;
