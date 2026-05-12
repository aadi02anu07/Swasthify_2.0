import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Calendar, Clock, ChevronRight, Loader2, Heart } from 'lucide-react'
import { usePatientData } from '@/hooks/usePatientData'
import { useVitalsChart } from '@/hooks/useVitalsChart'
import { getPatientAppointments } from '@/api/appointments'
import useAuthStore from '@/store/authStore'
import VitalsLatestCard from '@/components/vitals/VitalsLatestCard'
import HeartRateChart from '@/components/charts/HeartRateChart'
import BloodPressureChart from '@/components/charts/BloodPressureChart'
import AppointmentCard from '@/components/appointments/AppointmentCard'
import RecordTypeIcon from '@/components/history/RecordTypeIcon'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { PageLoader } from '@/components/ui/Spinner'
import { fDate, fAge } from '@/utils/formatters'

const StatCard = ({ icon: Icon, label, value, color, delay, to }) => {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="stat-card hover:bg-navy-700/20 transition-colors"
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
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function PatientDashboard() {
  const { user } = useAuthStore()
  const patientID = user?.patientID

  const { data, loading } = usePatientData(patientID)
  const { chartData, loading: chartLoading } = useVitalsChart(patientID, 10)
  const [appointments, setAppointments] = useState([])
  const [apptLoading, setApptLoading] = useState(true)

  useEffect(() => {
    if (!patientID) return
    getPatientAppointments(patientID)
      .then((res) => setAppointments(res.data.appointments || []))
      .catch(() => {})
      .finally(() => setApptLoading(false))
  }, [patientID])

  if (loading) return <PageLoader />

  const patient = data?.patient
  const latestVitals = data?.latestVitals
  const recentHistory = data?.recentHistory || []
  const stats = data?.stats
  const nextAppt = appointments.find((a) => a.status === 'pending' || a.status === 'confirmed')

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(16,185,129,0.05))' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={16} className="text-rose-400" />
              <p className="text-slate-400 text-sm">Welcome back</p>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">{patient?.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="mono text-blue-400 text-sm">{patient?.patientID}</span>
              {patient?.dob && <span className="text-slate-400 text-sm">{fAge(patient.dob)}</span>}
              {patient?.bloodGroup && (
                <span className="mono text-xs px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                  {patient.bloodGroup}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Records since</p>
            <p className="mono text-slate-300 font-medium mt-0.5">{patient?.dob ? fDate(patient.dob) : '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Activity} label="Vitals Recorded"  value={stats?.totalVitals}   color="#3b82f6" delay={0} />
        <StatCard icon={Clock}    label="Medical Records"  value={stats?.totalHistory}  color="#8b5cf6" delay={0.05} to="/patient/history" />
        <StatCard icon={Calendar} label="Appointments"     value={appointments.length}  color="#10b981" delay={0.1} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Latest vitals */}
          <div className="glass-card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-4">Current Vitals</p>
            <VitalsLatestCard reading={latestVitals} />
          </div>

          {/* Mini charts */}
          {!chartLoading && chartData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">❤ Heart Rate</p>
                <HeartRateChart data={chartData} />
              </div>
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">🩺 Blood Pressure</p>
                <BloodPressureChart data={chartData} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Next appointment */}
          <div className="glass-card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Next Appointment</p>
            {apptLoading ? (
              <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-500" /></div>
            ) : nextAppt ? (
              <div className="space-y-2">
                <Badge variant={nextAppt.status === 'pending' ? 'amber' : 'blue'} dot>{nextAppt.status}</Badge>
                <p className="text-slate-200 font-medium text-sm">{nextAppt.reason || 'Appointment'}</p>
                <p className="mono text-blue-400 text-sm">{fDate(nextAppt.scheduledAt)}</p>
                {nextAppt.staff?.name && (
                  <p className="text-slate-400 text-xs">with {nextAppt.staff.name}</p>
                )}
                {nextAppt.hospital?.name && (
                  <p className="text-slate-500 text-xs">{nextAppt.hospital.name}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">No upcoming appointments</p>
            )}
          </div>

          {/* Recent history */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Recent Records</p>
              <Link to="/patient/history" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            {recentHistory.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No records yet</p>
            ) : (
              <div className="space-y-3">
                {recentHistory.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <RecordTypeIcon type={r.type} size={14} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-xs font-medium truncate">{r.title}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{fDate(r.occurredAt)} · {r.hospital?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All appointments */}
          {appointments.length > 0 && (
            <div className="glass-card p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Recent Appointments</p>
              <div className="space-y-2">
                {appointments.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-slate-300 text-xs truncate">{a.reason || 'Appointment'}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{fDate(a.scheduledAt)}</p>
                    </div>
                    <Badge variant={a.status === 'pending' ? 'amber' : a.status === 'confirmed' ? 'blue' : a.status === 'completed' ? 'emerald' : 'rose'}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
