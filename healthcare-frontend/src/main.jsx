import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Analytics } from "@vercel/analytics/react"
import axios from 'axios'
import App from './App'
import useAuthStore from '@/store/authStore'
import './index.css'

/**
 * On every page load, silently try to restore the access token from the
 * httpOnly refresh cookie. If the cookie is still valid, we get a fresh
 * access token back. If not, the user stays logged out.
 *
 * This replaces the old pattern of reading accessToken from localStorage.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function restoreSession() {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    )
    useAuthStore.getState().setAccessToken(data.accessToken)
  } catch {
    // Cookie is missing or expired — clear any stale user state
    useAuthStore.getState().clearAuth()
  }
}

// Restore session before rendering so the app never flickers to /login
// for a user who has a valid refresh cookie
restoreSession().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0d1b2e',
              color: '#e2e8f0',
              border: '1px solid rgba(30, 58, 95, 0.6)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0d1b2e' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#0d1b2e' },
            },
          }}
        />
        <Analytics />
      </BrowserRouter>
    </React.StrictMode>
  )
})
