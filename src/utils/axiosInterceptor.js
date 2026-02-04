import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("expiresIn");
  localStorage.removeItem("userId");
  localStorage.removeItem("roleId");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("employeeData");
  window.location.href = "/sign-in";
};

export const setupAxiosInterceptor = () => {

  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");

      // ❗ IMPORTANT: do NOT attach token to refresh API
      if (token && !config.url.includes("Auth/refresh")) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Don't retry if already retried or if it's the refresh endpoint
      const isRefreshEndpoint = originalRequest?.url?.includes("Auth/refresh");
      if (isRefreshEndpoint || originalRequest._retry) {
        if (isRefreshEndpoint) {
          clearAuthAndRedirect();
        }
        return Promise.reject(error);
      }

      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const API_BASE = import.meta.env.VITE_APIURL;
        const response = await axios.post(`${API_BASE}Auth/refresh`, {
          refreshToken,
        });

        if (response.data?.success && response.data?.accessToken) {
          const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
          localStorage.setItem("token", accessToken);
          if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
          if (expiresIn) localStorage.setItem("expiresIn", String(expiresIn));

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } else {
          throw new Error("Invalid refresh response");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};
