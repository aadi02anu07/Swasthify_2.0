import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { recordVitals } from '@/api/vitals'
import Modal from '@/components/ui/Modal'
import AlertBanner from './AlertBanner'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const schema = z.object({
  bpSystolic: z.coerce.number().min(50).max(250),
  bpDiastolic: z.coerce.number().min(30).max(150),
  heartRate: z.coerce.number().min(20).max(300),
  sugar: z.coerce.number().min(10).max(600),
  weight: z.coerce.number().min(1).max(300).optional().or(z.literal('')),
  spo2: z.coerce.number().min(50).max(100).optional().or(z.literal('')),
  temperature: z.coerce.number().min(30).max(45).optional().or(z.literal('')),
  notes: z.string().optional(),
})

export default function VitalsForm({ isOpen, onClose, patientID, onSuccess }) {
  const [alerts, setAlerts] = useState([])
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    )
    try {
      const res = await recordVitals(patientID, payload)
      if (res.data.alerts?.length) {
        setAlerts(res.data.alerts)
      } else {
        toast.success('Vitals recorded successfully')
        reset()
        onSuccess?.(res.data.reading)
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record vitals')
    }
  }

  const handleAlertDismiss = () => {
    setAlerts([])
    toast.success('Vitals recorded')
    reset()
    onSuccess?.()
    onClose()
  }

  const Field = ({ name, label, placeholder, required }) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <input {...register(name)} placeholder={placeholder} className="input-field mono" type="number" step="any" />
      {errors[name] && <p className="text-xs text-rose-400 mt-1">{errors[name].message}</p>}
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Vitals" size="lg">
      {alerts.length > 0 ? (
        <AlertBanner alerts={alerts} onDismiss={handleAlertDismiss} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field name="bpSystolic" label="Systolic BP" placeholder="120" required />
            <Field name="bpDiastolic" label="Diastolic BP" placeholder="80" required />
            <Field name="heartRate" label="Heart Rate" placeholder="72" required />
            <Field name="sugar" label="Blood Sugar" placeholder="95" required />
            <Field name="spo2" label="SpO₂" placeholder="98" />
            <Field name="temperature" label="Temperature" placeholder="36.7" />
            <Field name="weight" label="Weight" placeholder="70" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} rows={3} placeholder="Clinical notes…" className="input-field resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? <><Spinner size="sm" /> Recording…</> : 'Record Vitals'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
