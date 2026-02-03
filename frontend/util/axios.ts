import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

// In-memory access token (short-lived)
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Refresh state & queue to avoid concurrent refreshes
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeToken(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function fetchAccessToken(): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL + "/user/token";
    const response = await axios.get(url, { withCredentials: true });
    return response.data && response.data.access_token ? response.data.access_token : null;
  } catch (err) {
    return null;
  }
}

function attachInterceptors(instance: AxiosInstance, options?: { withCredentials?: boolean }) {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (options && options.withCredentials) config.withCredentials = true;
    if (!config.headers) config.headers = {} as any;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;

      // If the token endpoint itself failed, or we already retried, don't attempt again
      if (originalRequest && originalRequest.url && originalRequest.url.includes("/user/token")) {
        // Redirect to login flow so user can re-authenticate
        //window.location.href = process.env.NEXT_PUBLIC_API_URL + "/login";
        return Promise.reject(error);
      }

      if (error.response && error.response.status === 401) {
        // Avoid infinite loop
        if (originalRequest && originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          const token = await fetchAccessToken();
          isRefreshing = false;
          if (token) {
            accessToken = token;
            onRefreshed(token);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios.request(originalRequest);
          } else {
            onRefreshed(null);
            // No token, redirect to login to re-authenticate
            //window.location.href = process.env.NEXT_PUBLIC_API_URL + "/login";
            return Promise.reject(error);
          }
        }

        // If refresh is in progress, queue the request
        return new Promise((resolve, reject) => {
          subscribeToken((token) => {
            if (token) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axios.request(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      } else if (error.response && error.response.status === 429) {
        // Rate limit: retry after delay and return a proper promise
        const delay = 10000; // 10s
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            axios
              .request(error.config)
              .then(resolve)
              .catch(reject);
          }, delay);
        });
      }

      return Promise.reject(error);
    }
  );
}

const newAxios = axios.create();
attachInterceptors(newAxios, { withCredentials: true });

const spotifyAxios = axios.create();
attachInterceptors(spotifyAxios);

export { newAxios, spotifyAxios };