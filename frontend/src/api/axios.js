import axios from "axios";

const api = axios.create({
  baseURL: "https://skincare-backend-abc1.onrender.com/api",
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
