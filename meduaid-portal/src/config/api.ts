// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

// Validate API URL format
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

export { API_BASE_URL };