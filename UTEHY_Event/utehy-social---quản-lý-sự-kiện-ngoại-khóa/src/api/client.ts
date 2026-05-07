import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

// Using the provided IP or fallback to a relative path if needed
// However, the user explicitly said avoid localhost:3000 for API
export const BASE_URL = 'http://192.168.1.108:3001/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please wait before trying again.');
      // Optional: You could trigger a global state change here to show a banner
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');
        
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = res.data.data;
        const user = useAuthStore.getState().user!;
        useAuthStore.getState().setAuth(access_token, refresh_token, user);
        original.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
