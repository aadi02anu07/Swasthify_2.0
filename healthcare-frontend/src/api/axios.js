import axios from 'axios'
import useAuthStore from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35000,         // 35s — Render free tier cold starts + Gemini calls
  withCredentials: true,  // required for cross-origin httpOnly refresh cookie
})

// Attach the in-memory access token from Zustand store on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ⚠ These endpoints must NEVER trigger a silent refresh attempt.
// If the login endpoint itself returns 401 (wrong password), without this guard
// the interceptor would try to refresh → fail → clearAuth → redirect to
// /login while the user is already on /login. Infinite loop.
const AUTH_URLS = [
  '/api/auth/staff/login',
  '/api/auth/patient/login',
  '/api/auth/hospital/login',
  '/api/auth/refresh',
]

const clearAuthAndRedirect = () => {
  useAuthStore.getState().clearAuth()
  window.location.href = '/login'
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Never attempt token refresh for auth endpoints themselves
    const isAuthUrl = AUTH_URLS.some((url) => original?.url?.includes(url))
    if (isAuthUrl) return Promise.reject(err)

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        // refreshToken lives in the httpOnly cookie — just call the endpoint.
        // The browser sends the cookie automatically (withCredentials: true).
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )

        // Store the new access token in memory only
        useAuthStore.getState().setAccessToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        // Ensure POST requests with no body retry correctly
        original.data = original.data || null
        return api(original)
      } catch {
        clearAuthAndRedirect()
      }
    }
    return Promise.reject(err)
  }
)

export default api
