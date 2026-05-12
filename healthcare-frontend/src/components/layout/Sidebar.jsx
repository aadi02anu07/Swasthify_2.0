import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Users, Activity, Settings, LogOut,
  Heart, Building2, ChevronRight, Clock
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { cn } from '@/utils/cn'

const navItems = {
  doctor: [
    { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/doctor/schedule', icon: Calendar, label: 'Schedule' },
  ],
  nurse: [
    { to: '/doctor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ],
  patient: [
    { to: '/patient', icon: Activity, label: 'My Health', end: true },
    { to: '/patient/history', icon: Clock, label: 'History' },
  ],
  admin: [
    { to: '/admin', icon: Building2, label: 'Hospital', end: true },
  ],
  hospital: [
    { to: '/admin', icon: Building2, label: 'Dashboard', end: true },
  ],
}

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const items = navItems[user?.role] || navItems[user?.type] || []

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 flex flex-col h-full border-r border-navy-600/30"
      style={{ background: 'rgba(5, 11, 26, 0.95)', backdropFilter: 'blur(10px)' }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-navy-600/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg glow-blue">
            <Heart size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-lg leading-none">Swasthify</p>
            <p className="text-xs text-slate-500 mt-0.5">Healthcare Network</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-navy-600/20">
        <div className="glass-card p-3">
          <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 capitalize mt-0.5">
            {user?.role || user?.type}
            {user?.patientID && ` · ${user.patientID}`}
          </p>
          {user?.hospital?.name && (
            <p className="text-xs text-blue-400/80 mt-0.5 truncate">{user.hospital.name}</p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-blue-400/60" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-navy-600/30">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.aside>
  )
}
