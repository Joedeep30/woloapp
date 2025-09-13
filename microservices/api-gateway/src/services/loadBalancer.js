// Simple load balancer for development
const requestCounts = {};

// Record a request for load balancing metrics
const recordRequest = async (serviceName, method) => {
  if (!requestCounts[serviceName]) {
    requestCounts[serviceName] = {
      total: 0,
      methods: {}
    };
  }
  
  requestCounts[serviceName].total++;
  
  if (!requestCounts[serviceName].methods[method]) {
    requestCounts[serviceName].methods[method] = 0;
  }
  
  requestCounts[serviceName].methods[method]++;
  
  // Log for development
  console.log(`📊 Load balancer: ${serviceName} ${method} - Total: ${requestCounts[serviceName].total}`);
};

// Get request statistics
const getStats = () => {
  return requestCounts;
};

// Reset statistics
const resetStats = () => {
  Object.keys(requestCounts).forEach(key => {
    delete requestCounts[key];
  });
};

module.exports = {
  recordRequest,
  getStats,
  resetStats
};