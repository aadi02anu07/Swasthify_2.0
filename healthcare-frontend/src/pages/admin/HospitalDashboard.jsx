import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Building2, Calendar, Clock, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { getHospitalAppointments, updateAppointmentStatus, cancelAppointment } from '@/api/appointments'
import useAuthStore from '@/store/authStore'
import AppointmentCard from '@/components/appointments/AppointmentCard'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

const TABS = [
  { id: '',           label: 'All' },
  { id: 'pending',    label: 'Pending' },
  { id: 'confirmed',  label: 'Confirmed' },
  { id: 'completed',  label: 'Completed' },
  { id: 'cancelled',  label: 'Cancelled' },
]

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </div>
    </div>
    <p className="mono text-3xl font-bold text-slate-100 mt-1">{value ?? '—'}</p>
  </motion.div>
)

export default function HospitalDashboard() {
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 20, page }
      if (tab) params.status = tab
      const res = await getHospitalAppointments(params)
      setAppointments(res.data.appointments || [])
      setPagination(res.data.pagination)
    } catch { toast.error('Failed to load appointments') }
    finally { setLoading(false) }
  }, [tab, page])

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    cancelled: appointments.filter((a) => a.status === 'cancelled').length,
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter((a) => a.scheduledAt?.startsWith(today))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-blue-400" />
            <h1 className="font-display text-2xl font-bold text-white">
              {user?.hospital?.name || user?.name || 'Hospital Dashboard'}
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            {user?.hospital?.city || user?.city} · Admin view
          </p>
        </div>
        <button onClick={fetchAppointments} className="btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar}    label="Today's Appointments" value={todayAppts.length}       color="#3b82f6" delay={0}    />
        <StatCard icon={Clock}       label="Pending"              value={counts.pending}           color="#f59e0b" delay={0.05} />
        <StatCard icon={CheckCircle} label="Confirmed"            value={counts.confirmed}         color="#10b981" delay={0.1}  />
        <StatCard icon={XCircle}     label="Cancelled"            value={counts.cancelled}         color="#f43f5e" delay={0.15} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(13,27,46,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tab === id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
            {id === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 mono text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Appointments list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description={tab ? `No ${tab} appointments found.` : 'No appointments yet.'} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {appointments.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} onRefresh={fetchAppointments} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="mono text-sm text-slate-400">{page} / {pagination.totalPages}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
