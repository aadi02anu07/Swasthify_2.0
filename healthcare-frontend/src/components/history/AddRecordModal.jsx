import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import { addMedicalRecord } from '@/api/history'
import { RECORD_TYPES, SEVERITY_LEVELS } from '@/utils/constants'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(5),
  type: z.string().min(1),
  severity: z.string().optional(),
  occurredAt: z.string().min(1),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
})

export default function AddRecordModal({ isOpen, onClose, patientID, onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    const payload = { ...data }
    if (!payload.attachmentUrl) delete payload.attachmentUrl
    if (!payload.severity) delete payload.severity
    try {
      const res = await addMedicalRecord(patientID, payload)
      toast.success('Medical record added')
      reset()
      onSuccess?.(res.data.record)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add record')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Medical Record" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input {...register('title')} placeholder="e.g. Type 2 Diabetes Mellitus" className="input-field" />
          {errors.title && <p className="text-xs text-rose-400 mt-1">Title is required</p>}
        </div>
        <div>
          <label className="label">Description *</label>
          <textarea {...register('description')} rows={3} placeholder="Clinical details…" className="input-field resize-none" />
          {errors.description && <p className="text-xs text-rose-400 mt-1">Description required</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type *</label>
            <select {...register('type')} className="select-field">
              <option value="">Select type</option>
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.type && <p className="text-xs text-rose-400 mt-1">Required</p>}
          </div>
          <div>
            <label className="label">Severity</label>
            <select {...register('severity')} className="select-field">
              <option value="">None</option>
              {SEVERITY_LEVELS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Date Occurred *</label>
          <input {...register('occurredAt')} type="date" className="input-field" max={new Date().toISOString().split('T')[0]} />
          {errors.occurredAt && <p className="text-xs text-rose-400 mt-1">Required</p>}
        </div>
        <div>
          <label className="label">Attachment URL</label>
          <input {...register('attachmentUrl')} placeholder="https://…" className="input-field" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? <><Spinner size="sm" /> Adding…</> : 'Add Record'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
