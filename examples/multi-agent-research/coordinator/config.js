module.exports = {
  // Coordinator server port
  port: process.env.COORDINATOR_PORT || 4000,

  // Main agent app server URL
  serverUrl: process.env.SERVER_URL || 'http://localhost:3000',

  // Maximum concurrent tasks
  maxConcurrentTasks: parseInt(process.env.MAX_CONCURRENT_TASKS) || 5,

  // Task timeout in milliseconds
  taskTimeout: parseInt(process.env.TASK_TIMEOUT) || 30000,

  // Number of retry attempts for failed tasks
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,

  // Retry delay in milliseconds
  retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
};
