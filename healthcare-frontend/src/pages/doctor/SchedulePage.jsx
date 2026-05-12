import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Loader2, Plus } from 'lucide-react'
import { getDoctorSchedule, updateAppointmentStatus, cancelAppointment } from '@/api/appointments'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'
import { fDate, fTime } from '@/utils/formatters'
import { format, addDays, subDays, startOfWeek, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const statusVariant = { pending: 'amber', confirmed: 'blue', completed: 'emerald', cancelled: 'rose' }

export default function SchedulePage() {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookOpen, setBookOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(format(new Date(), 'yyyy-MM-dd'))

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekFrom = format(weekStart, 'yyyy-MM-dd')
  const weekTo = format(addDays(weekStart, 6), 'yyyy-MM-dd')

  const fetchSchedule = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDoctorSchedule({ from: weekFrom, to: weekTo })
      setSchedule(res.data.schedule || [])
    } catch { toast.error('Failed to load schedule') }
    finally { setLoading(false) }
  }, [weekFrom, weekTo])

  useEffect(() => { fetchSchedule() }, [fetchSchedule])

  const dayAppointments = schedule.find((d) => d.date?.startsWith(selectedDay))?.appointments || []

  const handleStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status)
      toast.success(`Appointment ${status}`)
      fetchSchedule()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await cancelAppointment(id)
      toast.success('Cancelled')
      fetchSchedule()
    } catch { toast.error('Failed to cancel') }
  }

  const getCountForDay = (day) => {
    const d = format(day, 'yyyy-MM-dd')
    return schedule.find((s) => s.date?.startsWith(d))?.appointments?.length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My Schedule</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {format(weekStart, 'dd MMM')} – {format(addDays(weekStart, 6), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart((w) => subDays(w, 7))} className="btn-secondary w-9 h-9 p-0 justify-center">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="btn-secondary text-xs px-3">
            Today
          </button>
          <button onClick={() => setWeekStart((w) => addDays(w, 7))} className="btn-secondary w-9 h-9 p-0 justify-center">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setBookOpen(true)} className="btn-primary">
            <Plus size={14} /> Book
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const isSelected = key === selectedDay
          const isToday = key === format(new Date(), 'yyyy-MM-dd')
          const count = getCountForDay(day)
          return (
            <button
              key={key}
              onClick={() => setSelectedDay(key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : isToday
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                  : 'border-navy-600/30 text-slate-400 hover:border-navy-600/60 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-70">{format(day, 'EEE')}</span>
              <span className="mono font-bold text-lg leading-none">{format(day, 'd')}</span>
              {count > 0
                ? <span className={`mono text-xs font-medium px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-blue-400/20' : 'bg-slate-400/10'}`}>{count}</span>
                : <span className="w-1 h-1 rounded-full bg-slate-700" />
              }
            </button>
          )
        })}
      </div>

      {/* Day appointments */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-sm">{fDate(parseISO(selectedDay))}</h2>
          <span className="mono text-xs text-slate-500">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-slate-500" /></div>
        ) : dayAppointments.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="Nothing scheduled for this day." />
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-navy-600/30 hover:bg-navy-700/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/doctor/patient/${appt.patient?.patientID}`)}
              >
                <div className="text-center w-16 shrink-0">
                  <p className="mono text-blue-400 font-semibold">{fTime(appt.scheduledAt)}</p>
                </div>
                <div className="w-px h-10 bg-navy-600/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-slate-200 font-medium text-sm">{appt.patient?.name}</p>
                    <span className="mono text-xs text-blue-400/70">{appt.patient?.patientID}</span>
                    {appt.patient?.bloodGroup && (
                      <span className="mono text-xs px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {appt.patient.bloodGroup}
                      </span>
                    )}
                  </div>
                  {appt.reason && <p className="text-slate-400 text-xs mt-0.5">{appt.reason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={statusVariant[appt.status] || 'slate'}>{appt.status}</Badge>
                  {appt.status === 'pending' && (
                    <button onClick={() => handleStatus(appt.id, 'confirmed')} className="btn-success text-xs px-2 py-1">Confirm</button>
                  )}
                  {appt.status === 'confirmed' && (
                    <button onClick={() => handleStatus(appt.id, 'completed')} className="btn-success text-xs px-2 py-1">Complete</button>
                  )}
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button onClick={() => handleCancel(appt.id)} className="btn-danger text-xs px-2 py-1">Cancel</button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BookAppointmentModal isOpen={bookOpen} onClose={() => setBookOpen(false)} onSuccess={fetchSchedule} />
    </div>
  )
}
