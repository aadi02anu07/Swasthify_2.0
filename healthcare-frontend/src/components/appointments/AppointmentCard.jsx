import { Calendar, Clock, User, MapPin, X, CheckCircle, Check } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { fDate, fTime } from '@/utils/formatters'
import { updateAppointmentStatus, cancelAppointment } from '@/api/appointments'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

const statusVariant = { pending: 'amber', confirmed: 'blue', completed: 'emerald', cancelled: 'rose' }

export default function AppointmentCard({ appointment, onRefresh }) {
  const { user } = useAuthStore()
  const isStaff = user?.type === 'staff'
  const { id, scheduledAt, status, reason, notes, staff, patient, hospital } = appointment

  const canConfirm = isStaff && status === 'pending'
  const canComplete = isStaff && status === 'confirmed'
  const canCancel = status === 'pending' || status === 'confirmed'

  const update = async (newStatus, n) => {
    try {
      await updateAppointmentStatus(id, newStatus, n)
      toast.success(`Appointment ${newStatus}`)
      onRefresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  const cancel = async () => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await cancelAppointment(id)
      toast.success('Appointment cancelled')
      onRefresh?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    }
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant={statusVariant[status] || 'slate'} dot>{status}</Badge>
            <span className="text-slate-500 text-xs">·</span>
            <span className="mono text-xs text-blue-400">{patient?.patientID || patient?.name}</span>
          </div>
          <p className="font-medium text-slate-200 text-sm">{reason || 'No reason specified'}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={12} className="text-slate-500" />
              {fDate(scheduledAt)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} className="text-slate-500" />
              {fTime(scheduledAt)}
            </span>
            {(staff?.name || patient?.name) && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <User size={12} className="text-slate-500" />
                {staff?.name || patient?.name}
              </span>
            )}
            {hospital?.name && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={12} className="text-slate-500" />
                {hospital.name}
              </span>
            )}
          </div>
          {notes && <p className="text-xs text-slate-500 mt-2 italic">{notes}</p>}
        </div>

        {isStaff && (
          <div className="flex items-center gap-2">
            {canConfirm && (
              <button onClick={() => update('confirmed')} className="btn-success text-xs px-3 py-1.5">
                <Check size={13} /> Confirm
              </button>
            )}
            {canComplete && (
              <button onClick={() => update('completed')} className="btn-success text-xs px-3 py-1.5">
                <CheckCircle size={13} /> Complete
              </button>
            )}
            {canCancel && (
              <button onClick={cancel} className="btn-danger text-xs px-3 py-1.5">
                <X size={13} /> Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
