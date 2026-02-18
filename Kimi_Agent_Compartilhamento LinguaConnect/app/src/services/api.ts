import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('linguaconnect_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('linguaconnect_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('linguaconnect_access_token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('linguaconnect_access_token');
        localStorage.removeItem('linguaconnect_refresh_token');
        localStorage.removeItem('linguaconnect_user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    country?: string;
    nativeLanguage?: string;
    learningLanguages?: { language: string; level: string }[];
    bio?: string;
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  googleLogin: (data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) => api.post('/auth/google', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Users API
export const usersApi = {
  getUsers: (params?: {
    search?: string;
    nativeLanguage?: string;
    learningLanguage?: string;
    gender?: string;
    minAge?: number;
    maxAge?: number;
    excludeMe?: boolean;
  }) => api.get('/users', { params }),

  getUserById: (id: string) => api.get(`/users/${id}`),

  updateProfile: (data: Partial<{
    name: string;
    age: number;
    gender: string;
    country: string;
    nativeLanguage: string;
    learningLanguages: { language: string; level: string }[];
    bio: string;
    avatarUrl: string;
  }>) => api.put('/users/profile', data),

  deleteAccount: () => api.delete('/users/account'),
};

// Messages API
export const messagesApi = {
  getConversations: () => api.get('/messages/conversations'),

  createConversation: (userId: string) =>
    api.post('/messages/conversations', { userId }),

  getMessages: (conversationId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),

  sendMessage: (conversationId: string, content: string, type: 'text' | 'audio' = 'text') =>
    api.post(`/messages/conversations/${conversationId}/messages`, { content, type }),
};
