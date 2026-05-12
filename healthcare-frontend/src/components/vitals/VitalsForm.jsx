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
  bpSystolic:  z.coerce.number().min(50).max(250),
  bpDiastolic: z.coerce.number().min(30).max(150),
  heartRate:   z.coerce.number().min(20).max(300),
  sugar:       z.coerce.number().min(10).max(600),
  weight:      z.coerce.number().min(1).max(300).optional().or(z.literal('')),
  spo2:        z.coerce.number().min(50).max(100).optional().or(z.literal('')),
  temperature: z.coerce.number().min(30).max(45).optional().or(z.literal('')),
  notes:       z.string().optional(),
})

export default function VitalsForm({ isOpen, onClose, patientID, onSuccess }) {
  const [alerts, setAlerts]       = useState([])
  // Store the recorded reading so we can pass it even when alerts fired
  const [savedReading, setSavedReading] = useState(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    )
    try {
      const res = await recordVitals(patientID, payload)
      const reading = res.data.reading

      // Always save the reading — we need it for the UI update regardless of alerts
      setSavedReading(reading)

      if (res.data.alerts?.length) {
        setAlerts(res.data.alerts)
      } else {
        toast.success('Vitals recorded successfully')
        reset()
        onSuccess?.(reading)   // ← pass reading
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record vitals')
    }
  }

  const handleAlertDismiss = () => {
    toast.success('Vitals recorded')
    setAlerts([])
    reset()
    onSuccess?.(savedReading)  // ← pass the saved reading, not undefined
    setSavedReading(null)
    onClose()
  }

  const Field = ({ name, label, required }) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <input
        {...register(name)}
        type="number"
        step="any"
        className="input-field mono"
      />
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
            <Field name="bpSystolic"  label="Systolic BP (mmHg)"  required />
            <Field name="bpDiastolic" label="Diastolic BP (mmHg)" required />
            <Field name="heartRate"   label="Heart Rate (bpm)"    required />
            <Field name="sugar"       label="Blood Sugar (mg/dL)" required />
            <Field name="spo2"        label="SpO₂ (%)" />
            <Field name="temperature" label="Temperature (°C)" />
            <Field name="weight"      label="Weight (kg)" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Clinical notes…"
              className="input-field resize-none"
            />
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