import { io } from 'socket.io-client'
import { API_URL } from '@/utils/constants'

let socket = null

export const initSocket = (accessToken) => {
  if (socket?.connected) return socket

  socket = io(API_URL, {
    auth: { token: `Bearer ${accessToken}` },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinPatientRoom = (patientID) => {
  if (socket?.connected) {
    socket.emit('join:patient', patientID)
  }
}

export const leavePatientRoom = (patientID) => {
  if (socket?.connected) {
    socket.emit('leave:patient', patientID)
  }
}
