import { create } from 'zustand'

const useNotificationStore = create((set) => ({
  notifications: [],
  criticalAlerts: [],

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: Date.now() + Math.random(), timestamp: new Date() },
        ...state.notifications,
      ].slice(0, 50),
    })),

  addCriticalAlert: (alert) =>
    set((state) => ({
      criticalAlerts: [
        { ...alert, id: Date.now() + Math.random(), timestamp: new Date() },
        ...state.criticalAlerts,
      ].slice(0, 20),
    })),

  clearNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAllNotifications: () => set({ notifications: [] }),
}))

export default useNotificationStore
