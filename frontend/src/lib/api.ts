import axios from "axios";
import { useAuthStore } from "@/store/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = res.data;
          setTokens(access_token, refresh_token);
          original.headers.Authorization = `Bearer ${access_token}`;
          return api(original);
        } catch {
          logout();
        }
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
