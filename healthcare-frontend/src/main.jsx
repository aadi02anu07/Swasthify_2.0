import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </React.StrictMode>
)
