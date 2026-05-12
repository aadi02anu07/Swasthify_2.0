import { create } from 'zustand'

const getInitialState = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    if (user && accessToken) return { user, accessToken, refreshToken }
  } catch {}
  return { user: null, accessToken: null, refreshToken: null }
}

const useAuthStore = create((set) => ({
  ...getInitialState(),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ user, accessToken, refreshToken })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

export default useAuthStore
