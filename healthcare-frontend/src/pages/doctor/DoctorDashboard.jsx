import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Users, Clock, AlertCircle, Search, ChevronRight,
  Activity, CheckCircle, XCircle, Loader2, Plus, User
} from 'lucide-react'
import { getDoctorSchedule, getHospitalAppointments, updateAppointmentStatus } from '@/api/appointments'
import { searchPatientsByName } from '@/api/patients'
import useAuthStore from '@/store/authStore'
import useNotificationStore from '@/store/notificationStore'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'
import { fDate, fTime, fRelative } from '@/utils/formatters'
import toast from 'react-hot-toast'

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <p className="mono text-3xl font-bold text-slate-100 mt-1">{value ?? '—'}</p>
  </motion.div>
)

// ── Patient Search Autocomplete ───────────────────────────────────────────────
function PatientSearchBox() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Debounced search on name change
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchPatientsByName(query.trim())
        setResults(res.data.patients || [])
        setOpen(true)
        setActiveIdx(-1)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 320)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goToPatient = (patientID) => {
    setOpen(false)
    setQuery('')
    setResults([])
    navigate(`/doctor/patient/${patientID}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (activeIdx >= 0 && results[activeIdx]) {
      goToPatient(results[activeIdx].patientID)
      return
    }
    const raw = query.trim().toUpperCase()
    if (raw) navigate(`/doctor/patient/${raw}`)
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search patient by name..."
            className="input-field flex-1 w-full py-2 text-sm pr-8"
            autoComplete="off"
          />
          {searching && (
            <Loader2
              size={13}
              className="animate-spin text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2"
            />
          )}
        </div>
        <button type="submit" className="btn-primary px-3">
          <Search size={15} />
        </button>
      </form>

      {/* Dropdown results */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-2xl"
            style={{
              background: 'rgba(15,23,42,0.97)',
              border: '1px solid rgba(99,102,241,0.25)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <p className="px-3 pt-2.5 pb-1 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              {results.length} patient{results.length !== 1 ? 's' : ''} found
            </p>
            <ul className="pb-1.5">
              {results.map((p, idx) => (
                <li key={p.patientID}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors"
                    style={{
                      background: idx === activeIdx
                        ? 'rgba(99,102,241,0.15)'
                        : 'transparent',
                    }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => goToPatient(p.patientID)}
                  >
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.12)' }}
                    >
                      <User size={13} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 text-sm font-medium truncate">{p.name}</p>
                      <p className="mono text-[11px] text-indigo-400/80 mt-0.5">{p.patientID}</p>
                    </div>
                    {(p.gender || p.bloodGroup) && (
                      <div className="flex gap-1 shrink-0">
                        {p.gender && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
                          >
                            {p.gender}
                          </span>
                        )}
                        {p.bloodGroup && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md"
                            style={{ background: 'rgba(244,63,94,0.1)', color: '#fb7185' }}
                          >
                            {p.bloodGroup}
                          </span>
                        )}
                      </div>
                    )}
                    <ChevronRight size={13} className="text-slate-600 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {open && !searching && query.trim().length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl px-3 py-4 text-center"
            style={{
              background: 'rgba(15,23,42,0.97)',
              border: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            <p className="text-slate-500 text-sm">No patients found for &ldquo;{query}&rdquo;</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { criticalAlerts } = useNotificationStore()
  const [schedule, setSchedule] = useState([])
  const [hospitalAppts, setHospitalAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookOpen, setBookOpen] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [schedRes, hospRes] = await Promise.all([
        getDoctorSchedule({ from: today, to: today }),
        getHospitalAppointments({ limit: 20, status: 'pending' }),
      ])
      const todayBlock = schedRes.data.schedule?.find((d) => d.date?.startsWith(today))
      setSchedule(todayBlock?.appointments || [])
      setHospitalAppts(hospRes.data.appointments || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status)
      toast.success(`Appointment ${status}`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const pending   = hospitalAppts.filter((a) => a.status === 'pending').length
  const confirmed = hospitalAppts.filter((a) => a.status === 'confirmed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[1] || user?.name}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{fDate(new Date())} · {user?.hospital?.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar}     label="Today's Appointments" value={schedule.length}         color="#3b82f6"  delay={0} />
        <StatCard icon={Clock}        label="Pending Confirmations" value={pending}                 color="#f59e0b"  delay={0.05} />
        <StatCard icon={CheckCircle}  label="Confirmed Today"       value={confirmed}               color="#10b981"  delay={0.1} />
        <StatCard icon={AlertCircle}  label="Critical Alerts"       value={criticalAlerts.length}   color="#f43f5e"  delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Today's Schedule</h2>
            <button onClick={() => setBookOpen(true)} className="btn-secondary text-xs">
              <Plus size={13} /> Book
            </button>
          </div>

          {loading ? (
            <div className="glass-card p-8 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-slate-500" />
            </div>
          ) : schedule.length === 0 ? (
            <div className="glass-card">
              <EmptyState icon={Calendar} title="No appointments today" description="Your schedule is clear for today." />
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((appt, i) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-4 cursor-pointer hover:bg-navy-700/30 transition-colors"
                  onClick={() => navigate(`/doctor/patient/${appt.patient?.patientID}`)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center shrink-0 w-14">
                        <p className="mono text-blue-400 font-semibold text-sm">{fTime(appt.scheduledAt)}</p>
                      </div>
                      <div className="w-px h-8 bg-navy-600/60" />
                      <div className="min-w-0">
                        <p className="text-slate-200 font-medium text-sm truncate">{appt.patient?.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="mono text-xs text-blue-400/80">{appt.patient?.patientID}</p>
                          {appt.reason && <span className="text-slate-500 text-xs truncate">· {appt.reason}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Badge variant={appt.status === 'pending' ? 'amber' : appt.status === 'confirmed' ? 'blue' : 'emerald'}>
                        {appt.status}
                      </Badge>
                      {appt.status === 'pending' && (
                        <button onClick={() => handleStatus(appt.id, 'confirmed')} className="btn-success text-xs px-2 py-1">
                          <CheckCircle size={12} />
                        </button>
                      )}
                      <ChevronRight size={16} className="text-slate-600" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-4" style={{ position: 'relative', zIndex: 10 }}>
          {/* Patient lookup */}
          <div className="glass-card p-4" style={{ position: 'relative', zIndex: 20 }}>
            <h3 className="section-title text-sm mb-3 flex items-center gap-2">
              <Users size={13} className="text-indigo-400" />
              Quick Patient Lookup
            </h3>
            <PatientSearchBox />
            <p className="text-[10px] text-slate-600 mt-2">
              Type a patient name to search, or enter an exact Patient ID
            </p>
          </div>

          {/* Critical alerts */}
          {criticalAlerts.length > 0 && (
            <div className="glass-card p-4" style={{ borderColor: 'rgba(244,63,94,0.3)' }}>
              <h3 className="section-title text-sm mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-rose-400" />
                Critical Alerts
              </h3>
              <div className="space-y-2">
                {criticalAlerts.slice(0, 5).map((a, i) => (
                  <div key={a.id || i} className="p-3 rounded-xl text-xs" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <p className="text-rose-300 font-medium">{a.patientName || a.patientID}</p>
                    <p className="text-slate-400 mt-0.5">{a.message || 'Critical vitals recorded'}</p>
                    <p className="text-slate-600 mt-1">{fRelative(a.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending hospital appointments */}
          <div className="glass-card p-4">
            <h3 className="section-title text-sm mb-3">Pending Approvals</h3>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-500" /></div>
            ) : hospitalAppts.filter((a) => a.status === 'pending').length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">No pending appointments</p>
            ) : (
              <div className="space-y-2">
                {hospitalAppts.filter((a) => a.status === 'pending').slice(0, 5).map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-navy-700/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-slate-300 text-xs font-medium truncate">
                        {appt.patient?.name || appt.patient?.patientID}
                      </p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{fDate(appt.scheduledAt)} · {fTime(appt.scheduledAt)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleStatus(appt.id, 'confirmed')} className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle size={11} />
                      </button>
                      <button onClick={() => handleStatus(appt.id, 'cancelled')} className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                        <XCircle size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BookAppointmentModal isOpen={bookOpen} onClose={() => setBookOpen(false)} onSuccess={fetchData} />
    </div>
  )
}
