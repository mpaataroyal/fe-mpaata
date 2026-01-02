import axios from 'axios';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth'; // Import this

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://simple-maggot-expert.ngrok-free.app/api/v1';

// Create axios instance
const apiAgent = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase ID token
apiAgent.interceptors.request.use(
  async (config) => {
    try {
      // 1. Check current user state
      let user = auth.currentUser;

      // 2. If user is null, Firebase might still be loading the session from IndexedDB.
      // We wait for the first auth state change event to confirm if we are logged in or not.
      if (!user) {
        await new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (u) => {
            user = u; // Update local user variable
            unsubscribe(); // Run only once
            resolve();
          });
        });
      }

      // 3. If we have a user now, get the token
      if (user) {
        // Get fresh Firebase ID token
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiAgent.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const user = auth.currentUser;
        if (user) {
          // Force refresh the token
          const idToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${idToken}`;
          return apiAgent(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        console.error('Token refresh failed:', refreshError);
        await auth.signOut();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// API methods
export const api = {
  // Auth endpoints
  auth: {
    googleLogin: async (idToken) => {
      const response = await apiAgent.post('/auth/google', { idToken });
      return response.data;
    },
    logout: async (refreshToken) => {
      const response = await apiAgent.post('/auth/logout', { refreshToken });
      return response.data;
    },
    refresh: async (refreshToken) => {
      const response = await apiAgent.post('/auth/refresh', { refreshToken });
      return response.data;
    },
  },

  // User endpoints
  users: {
    getAll: async (params) => {
      const response = await apiAgent.get('/users', { params });
      return response.data;
    },
    create: async (data) => {
      // Calls POST /api/v1/users
      const response = await apiAgent.post('/users', data);
      return response.data;
    },
    // Added updateRole as discussed
    updateRole: async (uid, data) => {
      const response = await apiAgent.patch(`/users/${uid}/role`, data);
      return response.data;
    },
    getById: async (id) => {
      const response = await apiAgent.get(`/users/${id}`);
      return response.data;
    },
    update: async (id, data) => {
      const response = await apiAgent.put(`/users/${id}`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await apiAgent.delete(`/users/${id}`);
      return response.data;
    },
  },

  // Room endpoints
  rooms: {
    getAll: async (params) => {
      const response = await apiAgent.get('/rooms', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await apiAgent.get(`/rooms/${id}`);
      return response.data;
    },
    create: async (data) => {
      const response = await apiAgent.post('/rooms', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await apiAgent.put(`/rooms/${id}`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await apiAgent.delete(`/rooms/${id}`);
      return response.data;
    },
  },

  // Booking endpoints
  bookings: {
    getAll: async (params) => {
      const response = await apiAgent.get('/bookings', { params });
      return response.data;
    },
    getMine: async () => {
      const response = await apiAgent.get('/bookings/me');
      return response.data;
    },
    getById: async (id) => {
      const response = await apiAgent.get(`/bookings/${id}`);
      return response.data;
    },
    create: async (data) => {
      const response = await apiAgent.post('/bookings', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await apiAgent.put(`/bookings/${id}`, data);
      return response.data;
    },
    cancel: async (id) => {
      const response = await apiAgent.post(`/bookings/${id}/cancel`);
      return response.data;
    },
  },
  dashboard: {
    getStats: async (range) => {
      console.log('=======', range);
      
      const response = await apiAgent.get('/dashboard/stats', { params: { range } });
      return response.data;
    },
  },

  // Payment endpoints
  payments: {
    getAll: async (params) => {
      const response = await apiAgent.get('/payments', { params });
      return response.data;
    },
    getMine: async () => {
      const response = await apiAgent.get('/payments/me');
      return response.data;
    },
    getById: async (id) => {
      const response = await apiAgent.get(`/payments/${id}`);
      return response.data;
    },
    update: async (id, data) => {
      // This is the specific call that was missing/failing
      const response = await apiAgent.put(`/payments/${id}`, data);
      return response.data;
    },
    initiate: async (data) => {
      const response = await apiAgent.post('/payments/initiate', data);
      return response.data;
    },
  },

  // Hotel endpoints
  hotel: {
    getInfo: async () => {
      const response = await apiAgent.get('/hotel');
      return response.data;
    },
    update: async (data) => {
      const response = await apiAgent.put('/hotel', data);
      return response.data;
    },
  },

  // Availability endpoints
  availability: {
    check: async (params) => {
      const response = await apiAgent.get('/availability', { params });
      return response.data;
    },
  },
};

export default apiAgent;