import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import { createAppointment } from '@/api/appointments'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'

const schema = z.object({
  patientID: z.string().min(1),
  scheduledAt: z.string().min(1),
  reason: z.string().min(2),
  notes: z.string().optional(),
})

export default function BookAppointmentModal({ isOpen, onClose, defaultPatientID, onSuccess }) {
  const { user } = useAuthStore()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { patientID: defaultPatientID || '' },
  })

  const onSubmit = async (data) => {
    try {
      const payload = {
        patientID: data.patientID,
        staffId: user.id,
        scheduledAt: data.scheduledAt + ':00.000+05:30',
        reason: data.reason,
        notes: data.notes || undefined,
      }
      await createAppointment(payload)
      toast.success('Appointment booked')
      reset()
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment')
    }
  }

  const minDateTime = new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Patient ID *</label>
          <input {...register('patientID')} placeholder="PAT-2026-0001" className="input-field mono" />
          {errors.patientID && <p className="text-xs text-rose-400 mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Date & Time *</label>
          <input {...register('scheduledAt')} type="datetime-local" min={minDateTime} className="input-field" />
          {errors.scheduledAt && <p className="text-xs text-rose-400 mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Reason *</label>
          <input {...register('reason')} placeholder="e.g. Diabetes follow-up" className="input-field" />
          {errors.reason && <p className="text-xs text-rose-400 mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea {...register('notes')} rows={2} placeholder="Additional notes…" className="input-field resize-none" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? <><Spinner size="sm" /> Booking…</> : 'Book Appointment'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
