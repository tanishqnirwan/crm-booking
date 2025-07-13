import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try to get token from localStorage (for backward compatibility)
    let token = localStorage.getItem('access_token');
    
    // If not in localStorage, try to get from Zustand store
    if (!token) {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          token = authData.state?.access_token;
        }
      } catch (e) {
        console.warn('Failed to parse auth storage:', e);
      }
    }
    
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export default api; 