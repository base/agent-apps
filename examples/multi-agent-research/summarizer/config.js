module.exports = {
  // Agent identity
  agentName: process.env.AGENT_NAME || 'SummarizerAgent',

  // Agent capabilities
  capabilities: ['summarize', 'condense', 'format'],

  // Server port
  port: process.env.PORT || 4002,

  // Main agent app server URL
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',

  // Coordinator URL
  coordinatorUrl: process.env.COORDINATOR_URL || 'http://localhost:4000',
};
