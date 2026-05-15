import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/notificationStore'
import { initSocket, disconnectSocket } from '@/socket/socket'
import { API_URL } from '@/utils/constants'
import toast from 'react-hot-toast'

// Ping the backend health-check every 10 minutes to prevent Render free-tier cold starts.
// Must use the public GET / endpoint — NOT an auth endpoint — to avoid spurious 401 errors.
const useKeepAlive = () => {
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/`).catch(() => {})
    ping() // ping immediately on mount
    const id = setInterval(ping, 10 * 60 * 1000) // then every 10 min
    return () => clearInterval(id)
  }, [])
}

export default function AppLayout() {
  const { accessToken } = useAuthStore()
  const { addNotification, addCriticalAlert } = useNotificationStore()

  useKeepAlive()

  useEffect(() => {
    if (!accessToken) return

    const socket = initSocket(accessToken)

    socket.on('notification', (data) => {
      addNotification(data)
      if (data.type === 'error') toast.error(data.message)
      else if (data.type === 'warning') toast(data.message, { icon: '⚠️' })
      else if (data.type === 'success') toast.success(data.message)
      else toast(data.message)
    })

    socket.on('vitals:critical', (data) => {
      addCriticalAlert(data)
      toast.error(`🚨 Critical vitals: ${data.patientName || data.patientID}`, { duration: 10000 })
    })

    socket.on('appointment:updated', (data) => {
      addNotification({
        title: 'Appointment Updated',
        message: `Appointment status changed to ${data.appointment?.status}`,
        type: 'info',
      })
    })

    return () => {
      socket.off('notification')
      socket.off('vitals:critical')
      socket.off('appointment:updated')
      disconnectSocket()
    }
  }, [accessToken])

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto page-bg">
          <div className="p-6 max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
