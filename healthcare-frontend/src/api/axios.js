import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 35000,         // 35s — Render free tier cold starts + Gemini calls
  withCredentials: true,  // required for cross-origin cookie (httpOnly refresh token)
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ⚠ These endpoints must NEVER trigger a silent refresh attempt.
// If the login endpoint itself returns 401 (wrong password), without this guard
// the interceptor would try to refresh → fail → localStorage.clear() → redirect to
// /login while the user is already on /login trying to log in. Infinite loop.
const AUTH_URLS = [
  '/api/auth/staff/login',
  '/api/auth/patient/login',
  '/api/auth/hospital/login',
  '/api/auth/refresh',
]

// ⚠ Use removeItem, NOT localStorage.clear().
// .clear() wipes EVERY key including tokens just written by a successful login
// if a background 401 fires at the same moment.
const clearAuthAndRedirect = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
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
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${BASE_URL}/api/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          )
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          original.headers.Authorization = `Bearer ${data.accessToken}`
          // Ensure POST requests with no body retry correctly
          original.data = original.data || null
          return api(original)
        } catch {
          clearAuthAndRedirect()
        }
      } else {
        clearAuthAndRedirect()
      }
    }
    return Promise.reject(err)
  }
)

export default api
