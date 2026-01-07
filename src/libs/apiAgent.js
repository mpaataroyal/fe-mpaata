import axios from 'axios';
import { auth } from './firebase'; // Ensure this path points to your Client SDK init
import { onAuthStateChanged } from 'firebase/auth';

// In Next.js, API routes are relative to the domain
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiAgent = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiAgent.interceptors.request.use(
  async (config) => {
    try {
      let user = auth.currentUser;
      if (!user) {
        await new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, (u) => {
            user = u;
            unsubscribe();
            resolve();
          });
        });
      }
      if (user) {
        const idToken = await user.getIdToken();
        config.headers.Authorization = `Bearer ${idToken}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ... (Rest of interceptors remain the same) ...
// The endpoints remain exactly the same as they map 1:1 to the new folder structure

apiAgent.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const user = auth.currentUser;
        if (user) {
          const idToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${idToken}`;
          return apiAgent(originalRequest);
        }
      } catch (refreshError) {
        await auth.signOut();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  auth: {
    googleLogin: async (idToken) => (await apiAgent.post('/auth/google', { idToken })).data,
    logout: async () => (await apiAgent.post('/auth/logout')).data,
  },
  users: {
    getAll: async (params) => (await apiAgent.get('/users', { params })).data,
    create: async (data) => (await apiAgent.post('/users', data)).data,
    updateRole: async (uid, role) => (await apiAgent.patch(`/users/${uid}/role`, { role })).data,
    getById: async (id) => (await apiAgent.get(`/users/${id}`)).data,
    update: async (id, data) => (await apiAgent.put(`/users/${id}`, data)).data,
    delete: async (id) => (await apiAgent.delete(`/users/${id}`)).data,
  },
  rooms: {
    getAll: async (params) => (await apiAgent.get('/rooms', { params })).data,
    getById: async (id) => (await apiAgent.get(`/rooms/${id}`)).data,
    create: async (data) => (await apiAgent.post('/rooms', data)).data,
    update: async (id, data) => (await apiAgent.put(`/rooms/${id}`, data)).data,
    delete: async (id) => (await apiAgent.delete(`/rooms/${id}`)).data,
  },
  bookings: {
    getAll: async (params) => (await apiAgent.get('/bookings', { params })).data,
    getMine: async () => (await apiAgent.get('/bookings/me')).data,
    getById: async (id) => (await apiAgent.get(`/bookings/${id}`)).data,
    create: async (data) => (await apiAgent.post('/bookings', data)).data,
    update: async (id, data) => (await apiAgent.put(`/bookings/${id}`, data)).data,
    cancel: async (id) => (await apiAgent.post(`/bookings/${id}/cancel`)).data,
  },
  payments: {
    getAll: async (params) => (await apiAgent.get('/payments', { params })).data,
    getMine: async () => (await apiAgent.get('/payments/me')).data,
    getById: async (id) => (await apiAgent.get(`/payments/${id}`)).data,
    update: async (id, data) => (await apiAgent.put(`/payments/${id}`, data)).data,
    initiate: async (data) => (await apiAgent.post('/payments/initiate', data)).data,
  },
  dashboard: {
    getStats: async (range) => (await apiAgent.get('/dashboard/stats', { params: { range } })).data,
  },
  availability: {
    check: async (params) => (await apiAgent.post('/availability', params)).data, // Changed from GET to POST based on your file
  },
  cms: {
    // Add CMS methods if needed
  }
};

export default apiAgent;