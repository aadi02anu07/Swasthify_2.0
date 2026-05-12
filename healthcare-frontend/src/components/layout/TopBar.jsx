import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useNotificationStore from '@/store/notificationStore'
import useAuthStore from '@/store/authStore'
import { fRelative } from '@/utils/formatters'

export default function TopBar() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { notifications, criticalAlerts, clearNotification } = useNotificationStore()
  const [search, setSearch] = useState('')
  const [showNotifs, setShowNotifs] = useState(false)

  const isStaff = user?.type === 'staff'
  const totalAlerts = notifications.length + criticalAlerts.length

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim() && isStaff) {
      navigate(`/doctor/patient/${search.trim().toUpperCase()}`)
      setSearch('')
    }
  }

  return (
    <header className="h-14 border-b border-navy-600/30 flex items-center px-6 gap-4"
      style={{ background: 'rgba(5, 11, 26, 0.8)', backdropFilter: 'blur(10px)' }}>

      {isStaff && (
        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient ID…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl text-slate-300 placeholder-slate-600 outline-none transition-all"
              style={{ background: 'rgba(13, 27, 46, 0.6)', border: '1px solid rgba(30, 58, 95, 0.4)' }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(30, 58, 95, 0.4)'}
            />
          </div>
        </form>
      )}

      <div className="flex-1" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-navy-700/50 transition-colors"
        >
          <Bell size={18} />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-medium">
              {Math.min(totalAlerts, 9)}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              className="absolute right-0 top-11 w-80 glass-card-elevated shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-navy-600/30 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-200">Notifications</p>
                <button onClick={() => setShowNotifs(false)} className="text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {criticalAlerts.map((a) => (
                  <div key={a.id} className="p-3 border-b border-navy-600/20 bg-rose-500/5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-rose-400">🚨 Critical Alert</p>
                        <p className="text-xs text-slate-400 mt-0.5">{a.message || `Patient ${a.patientID}`}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{fRelative(a.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 border-b border-navy-600/20 hover:bg-navy-700/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-300 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{fRelative(n.timestamp)}</p>
                      </div>
                      <button onClick={() => clearNotification(n.id)} className="text-slate-600 hover:text-slate-400 shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {totalAlerts === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
