import { create } from 'zustand'

/**
 * Auth Store
 *
 * Security model:
 *  - accessToken  → Zustand memory ONLY (never localStorage — XSS risk)
 *  - refreshToken → httpOnly cookie set by backend (we never touch it in JS)
 *  - user         → localStorage only (non-sensitive UI state — name, role, etc.)
 *
 * On page refresh the accessToken is gone from memory.
 * App.jsx calls /api/auth/refresh on mount to silently restore it from the cookie.
 */

const getInitialUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    return user || null
  } catch {
    return null
  }
}

const useAuthStore = create((set) => ({
  user:        getInitialUser(),
  accessToken: null, // always starts null — restored via /api/auth/refresh on mount

  setAuth: (user, accessToken) => {
    // Only persist the user object — NOT the token
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, accessToken })
  },

  setAccessToken: (accessToken) => {
    set({ accessToken })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    set({ user: null, accessToken: null })
  },
}))

export default useAuthStore
