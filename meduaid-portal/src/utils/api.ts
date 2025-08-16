import { API_BASE_URL } from '../config/api';

// Get auth headers with JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Universal GET request
export const apiGet = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  console.log(`[API] GET ${endpoint} - Token present: ${!!token}, Token length: ${token?.length || 0}`);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  
  if (!response.ok) {
    console.error(`[API] GET ${endpoint} failed - Status: ${response.status}, StatusText: ${response.statusText}`);
    
    if (response.status === 401) {
      const errorBody = await response.text();
      console.error(`[API] 401 Error details for ${endpoint}:`, errorBody);
    }
    
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  console.log(`[API] GET ${endpoint} successful - Status: ${response.status}`);
  return response.json();
};

// Universal POST request
export const apiPost = async (endpoint: string, data?: any, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  console.log(`[API] POST ${endpoint} - Token present: ${!!token}, Token length: ${token?.length || 0}`);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  
  if (!response.ok) {
    console.error(`[API] POST ${endpoint} failed - Status: ${response.status}, StatusText: ${response.statusText}`);
    
    if (response.status === 401) {
      const errorBody = await response.text();
      console.error(`[API] 401 Error details for ${endpoint}:`, errorBody);
    }
    
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  console.log(`[API] POST ${endpoint} successful - Status: ${response.status}`);
  return response.json();
};

// Universal PUT request
export const apiPut = async (endpoint: string, data?: any, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Universal DELETE request
export const apiDelete = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Universal PATCH request
export const apiPatch = async (endpoint: string, data?: any, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// File upload utility
export const apiUpload = async (endpoint: string, formData: FormData, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  
  // Add authorization header if token exists, but don't set Content-Type for file uploads
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
    body: formData,
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}; 