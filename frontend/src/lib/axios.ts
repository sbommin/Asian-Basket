// // src/lib/axios.ts - MUST HAVE THIS EXACTLY
// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://api.asianbasket.ie/api/",
//   timeout: 10000,
// });

// // ✅ REQUEST INTERCEPTOR - ADDS TOKEN AUTOMATICALLY
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("access");
//     console.log("🔑 Sending token:", !!token ? "YES" : "NO"); // DEBUG
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ✅ RESPONSE INTERCEPTOR - LOGS ERRORS
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error("❌ API ERROR:", error.response?.status, error.response?.data);
//     return Promise.reject(error);
//   }
// );

// export default api;
// src/lib/axios.ts
import axios from "axios";

const BASE_URL = "https://api.asianbasket.ie/api/";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ── REQUEST INTERCEPTOR — auto-attach token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR — auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Token expired → try to refresh ──────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint directly (not via `api` to avoid infinite loop)
        const res = await axios.post(`${BASE_URL}auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = res.data.access;
        localStorage.setItem("access", newAccessToken);

        // Update default header + retry queued requests
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        // Retry the original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh also failed — session expired, force logout
        processQueue(refreshError, null);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
