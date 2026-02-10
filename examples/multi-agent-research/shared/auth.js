/**
 * Shared authentication utilities for multi-agent system
 * Handles fishnet-auth authentication flow
 */

class AgentAuth {
  constructor(serverUrl, agentName) {
    this.serverUrl = serverUrl;
    this.agentName = agentName;
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with the server using fishnet-auth
   * @returns {Promise<string>} Bearer token
   */
  async authenticate() {
    try {
      // Step 1: Request challenge
      console.log(`[${this.agentName}] Requesting authentication challenge...`);
      const challengeResponse = await fetch(
        `${this.serverUrl}/api/agent-auth?name=${encodeURIComponent(this.agentName)}`
      );

      if (!challengeResponse.ok) {
        throw new Error(`Failed to get challenge: ${challengeResponse.statusText}`);
      }

      const challenge = await challengeResponse.json();
      console.log(`[${this.agentName}] Received ${challenge.tasks?.length || 0} tasks`);

      // Step 2: Solve tasks
      const solutions = this.solveTasks(challenge.tasks);

      // Step 3: Submit solutions
      console.log(`[${this.agentName}] Submitting solutions...`);
      const authResponse = await fetch(`${this.serverUrl}/api/agent-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.agentName,
          solutions,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.text();
        throw new Error(`Authentication failed: ${error}`);
      }

      const { token, expiresIn } = await authResponse.json();
      this.token = token;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);

      console.log(`[${this.agentName}] ✓ Authenticated successfully`);
      return token;
    } catch (error) {
      console.error(`[${this.agentName}] Authentication error:`, error.message);
      throw error;
    }
  }

  /**
   * Solve fishnet-auth reasoning tasks
   * @param {Array} tasks - Array of reasoning tasks
   * @returns {Array} Solutions to the tasks
   */
  solveTasks(tasks) {
    return tasks.map((task) => {
      switch (task.type) {
        case 'reverse':
          // Reverse a string
          return task.input.split('').reverse().join('');

        case 'sort':
          // Sort an array
          return [...task.input].sort((a, b) => {
            if (typeof a === 'number') return a - b;
            return String(a).localeCompare(String(b));
          });

        case 'math':
          // Evaluate mathematical expression
          // Note: In production, use a safe math parser
          try {
            // Simple evaluation for basic operations
            return this.evaluateMath(task.input);
          } catch (e) {
            console.error(`[${this.agentName}] Math task failed:`, e);
            return null;
          }

        case 'pattern':
          // Find pattern in sequence
          return this.findPattern(task.input);

        case 'logic':
          // Solve logic puzzle
          return this.solveLogic(task.input);

        default:
          console.warn(`[${this.agentName}] Unknown task type: ${task.type}`);
          return null;
      }
    });
  }

  /**
   * Evaluate simple mathematical expressions
   * @param {string} expression - Math expression
   * @returns {number} Result
   */
  evaluateMath(expression) {
    // Simple safe math evaluation
    const cleaned = expression.replace(/[^0-9+\-*/().\s]/g, '');
    // In production, use a proper math parser library
    return Function(`'use strict'; return (${cleaned})`)();
  }

  /**
   * Find pattern in number sequence
   * @param {Array<number>} sequence - Number sequence
   * @returns {number} Next number in sequence
   */
  findPattern(sequence) {
    if (sequence.length < 2) return sequence[0];

    // Check for arithmetic sequence
    const diff = sequence[1] - sequence[0];
    let isArithmetic = true;
    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i] - sequence[i - 1] !== diff) {
        isArithmetic = false;
        break;
      }
    }
    if (isArithmetic) {
      return sequence[sequence.length - 1] + diff;
    }

    // Check for geometric sequence
    if (sequence[0] !== 0) {
      const ratio = sequence[1] / sequence[0];
      let isGeometric = true;
      for (let i = 2; i < sequence.length; i++) {
        if (sequence[i - 1] === 0 || sequence[i] / sequence[i - 1] !== ratio) {
          isGeometric = false;
          break;
        }
      }
      if (isGeometric) {
        return sequence[sequence.length - 1] * ratio;
      }
    }

    // Default: return last element
    return sequence[sequence.length - 1];
  }

  /**
   * Solve simple logic puzzles
   * @param {Object} puzzle - Logic puzzle
   * @returns {*} Solution
   */
  solveLogic(puzzle) {
    // Implement logic puzzle solving
    // This is a placeholder for more complex logic
    return puzzle.answer || true;
  }

  /**
   * Get current authentication token
   * Automatically re-authenticates if token is expired
   * @returns {Promise<string>} Valid bearer token
   */
  async getToken() {
    if (!this.token || this.isTokenExpired()) {
      await this.authenticate();
    }
    return this.token;
  }

  /**
   * Check if token is expired or about to expire
   * @returns {boolean} True if token needs refresh
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    // Refresh if less than 5 minutes remaining
    return Date.now() > this.tokenExpiry - 300000;
  }

  /**
   * Make authenticated request to server
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async authenticatedFetch(endpoint, options = {}) {
    const token = await this.getToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    return fetch(`${this.serverUrl}${endpoint}`, {
      ...options,
      headers,
    });
  }

  /**
   * Revoke current token
   */
  logout() {
    this.token = null;
    this.tokenExpiry = null;
    console.log(`[${this.agentName}] Logged out`);
  }
}

module.exports = AgentAuth;
