import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Calendar, Clock, CheckCircle, XCircle,
  Loader2, RefreshCw, UserPlus, Eye, EyeOff, Copy, Check
} from 'lucide-react'
import { getHospitalAppointments, updateAppointmentStatus, cancelAppointment } from '@/api/appointments'
import { registerStaff } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import AppointmentCard from '@/components/appointments/AppointmentCard'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const TABS = [
  { id: '',          label: 'All' },
  { id: 'pending',   label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

const staffSchema = z.object({
  staffID:  z.string().min(2, 'Required'),
  name:     z.string().min(2, 'Required'),
  role:     z.enum(['doctor', 'nurse', 'admin']),
  password: z.string().min(6, 'Min 6 characters'),
})

function RegisterStaffModal({ isOpen, onClose, registrationCode }) {
  const [showPassword, setShowPassword] = useState(false)
  const [codeCopied, setCodeCopied]     = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: { role: 'doctor' },
  })

  const onSubmit = async (data) => {
    try {
      await registerStaff({ ...data, registrationCode })
      toast.success(`${data.name} registered successfully as ${data.role}`)
      reset()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(registrationCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Staff" size="md">
      {/* Registration code display */}
      <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p className="text-xs text-slate-500 mb-1">Hospital Registration Code</p>
        <div className="flex items-center justify-between gap-2">
          <p className="mono text-blue-400 font-semibold text-lg">{registrationCode || '—'}</p>
          <button onClick={copyCode} className="btn-secondary text-xs px-2 py-1">
            {codeCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Staff can also self-register using this code</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Staff ID *</label>
            <input {...register('staffID')} placeholder="DOC-002" className="input-field mono" />
            {errors.staffID && <p className="text-xs text-rose-400 mt-1">{errors.staffID.message}</p>}
          </div>
          <div>
            <label className="label">Role *</label>
            <select {...register('role')} className="select-field">
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Full Name *</label>
          <input {...register('name')} placeholder="Dr. Jane Smith" className="input-field" />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">Password *</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 6 characters"
              className="input-field pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? <><Spinner size="sm" /> Registering…</> : <><UserPlus size={14} /> Register Staff</>}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

// ── Also add patient registration modal ─────────────────────────────────────

import { BLOOD_GROUPS } from '@/utils/constants'
import { registerPatient } from '@/api/auth'

function RegisterPatientModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false)
  const [createdID, setCreatedID]       = useState(null)
  const [copied, setCopied]             = useState(false)
  const [loading, setLoading]           = useState(false)
  const [form, setForm] = useState({ name: '', dob: '', bloodGroup: '', gender: '', phone: '', password: '' })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Object.values(form).some((v) => !v)) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const res = await registerPatient(form)
      setCreatedID(res.data.patient?.patientID)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCreatedID(null)
    setForm({ name: '', dob: '', bloodGroup: '', gender: '', phone: '', password: '' })
    onClose()
  }

  const copyID = () => {
    navigator.clipboard.writeText(createdID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register New Patient" size="md">
      {createdID ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Check size={24} className="text-emerald-400" />
          </div>
          <p className="text-slate-300 font-medium">Patient registered successfully!</p>
          <div className="p-4 rounded-xl" style={{ background: 'rgba(37,99,235,0.08)', border: '2px dashed rgba(59,130,246,0.3)' }}>
            <p className="text-xs text-slate-500 mb-1">Patient ID</p>
            <p className="mono text-2xl font-bold text-blue-400">{createdID}</p>
          </div>
          <p className="text-slate-500 text-sm">Share this ID with the patient — they'll need it to log in.</p>
          <div className="flex gap-3">
            <button onClick={copyID} className="btn-secondary flex-1">
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy ID</>}
            </button>
            <button onClick={handleClose} className="btn-primary flex-1">Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input value={form.name} onChange={update('name')} placeholder="Rahul Mehta" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date of Birth *</label>
              <input value={form.dob} onChange={update('dob')} type="date"
                max={new Date().toISOString().split('T')[0]} className="input-field" />
            </div>
            <div>
              <label className="label">Gender *</label>
              <select value={form.gender} onChange={update('gender')} className="select-field">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Blood Group *</label>
              <select value={form.bloodGroup} onChange={update('bloodGroup')} className="select-field">
                <option value="">Select</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone *</label>
              <input value={form.phone} onChange={update('phone')} placeholder="9876543210"
                className="input-field mono" type="tel" />
            </div>
          </div>
          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={update('password')} placeholder="Min 8 characters" className="input-field pr-11" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Spinner size="sm" /> Registering…</> : 'Register Patient'}
            </button>
            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="stat-card">
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
  const [allStats, setAllStats]         = useState({ today: 0, pending: 0, confirmed: 0, cancelled: 0 })
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('')
  const [page, setPage]                 = useState(1)
  const [pagination, setPagination]     = useState(null)
  const [staffModalOpen, setStaffModalOpen]     = useState(false)
  const [patientModalOpen, setPatientModalOpen] = useState(false)

  const registrationCode = user?.registrationCode || user?.hospital?.registrationCode

  // Fetch stats from all appointments (no status filter)
  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await getHospitalAppointments({ limit: 200 })
      const all = res.data.appointments || []
      setAllStats({
        today:     all.filter((a) => a.scheduledAt?.startsWith(today)).length,
        pending:   all.filter((a) => a.status === 'pending').length,
        confirmed: all.filter((a) => a.status === 'confirmed').length,
        cancelled: all.filter((a) => a.status === 'cancelled').length,
      })
    } catch {}
  }, [])

  // Fetch filtered/paginated list for table
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

  useEffect(() => { setPage(1) }, [tab])
  useEffect(() => { fetchAppointments(); fetchStats() }, [fetchAppointments])

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {registrationCode && (
            <p className="text-xs text-slate-500 mt-1">
              Registration code: <span className="mono text-blue-400">{registrationCode}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setPatientModalOpen(true)} className="btn-secondary">
            <UserPlus size={14} /> New Patient
          </button>
          <button onClick={() => setStaffModalOpen(true)} className="btn-primary">
            <UserPlus size={14} /> Register Staff
          </button>
          <button onClick={() => { fetchAppointments(); fetchStats() }} className="btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar}    label="Today's Appointments" value={allStats.today}     color="#3b82f6" delay={0} />
        <StatCard icon={Clock}       label="Pending"              value={allStats.pending}   color="#f59e0b" delay={0.05} />
        <StatCard icon={CheckCircle} label="Confirmed"            value={allStats.confirmed} color="#10b981" delay={0.1} />
        <StatCard icon={XCircle}     label="Cancelled"            value={allStats.cancelled} color="#f43f5e" delay={0.15} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit overflow-x-auto"
        style={{ background: 'rgba(13,27,46,0.5)', border: '1px solid rgba(30,58,95,0.3)' }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              tab === id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
            {id === 'pending' && allStats.pending > 0 && (
              <span className="ml-1.5 mono text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                {allStats.pending}
              </span>
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
        <EmptyState icon={Calendar} title="No appointments"
          description={tab ? `No ${tab} appointments found.` : 'No appointments yet.'} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {appointments.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt}
              onRefresh={() => { fetchAppointments(); fetchStats() }} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
            Previous
          </button>
          <span className="mono text-sm text-slate-400">{page} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <RegisterStaffModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        registrationCode={registrationCode}
      />
      <RegisterPatientModal
        isOpen={patientModalOpen}
        onClose={() => setPatientModalOpen(false)}
      />
    </div>
  )
}