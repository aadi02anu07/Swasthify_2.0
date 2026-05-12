import { Heart, Activity, Droplets, Wind, Thermometer, Scale } from 'lucide-react'
import { motion } from 'framer-motion'
import { getVitalStatus, getVitalStatusColor, fDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const vitalsConfig = [
  { key: 'heartRate',    label: 'Heart Rate',   unit: 'bpm',   icon: Heart,        color: '#f43f5e', metricKey: 'heartRate' },
  { key: 'bp',          label: 'Blood Pressure', unit: 'mmHg', icon: Activity,     color: '#3b82f6', metricKey: 'bpSystolic' },
  { key: 'sugar',       label: 'Blood Sugar',   unit: 'mg/dL', icon: Droplets,     color: '#f59e0b', metricKey: 'sugar' },
  { key: 'spo2',        label: 'SpO₂',          unit: '%',     icon: Wind,         color: '#8b5cf6', metricKey: 'spo2' },
  { key: 'temperature', label: 'Temperature',   unit: '°C',    icon: Thermometer,  color: '#06b6d4', metricKey: 'temperature' },
  { key: 'weight',      label: 'Weight',        unit: 'kg',    icon: Scale,        color: '#64748b', metricKey: null },
]

function VitalCard({ config, reading, index }) {
  let value = reading?.[config.key]
  let displayValue = value

  if (config.key === 'bp') {
    displayValue = reading?.bpSystolic && reading?.bpDiastolic
      ? `${reading.bpSystolic}/${reading.bpDiastolic}`
      : '—'
    value = reading?.bpSystolic
  }

  const status = config.metricKey ? getVitalStatus(config.metricKey, value) : 'normal'
  const colors = getVitalStatusColor(status)
  const Icon = config.icon

  const statusLabels = { normal: 'Normal', warning: 'Warning', critical: 'Critical', unknown: '—' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'glass-card p-4 border',
        status === 'critical' && 'vital-card-critical',
        status === 'warning' && 'vital-card-warning',
        status === 'normal' && 'vital-card-normal',
        !config.metricKey && 'border-slate-500/20',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${config.color}15` }}>
          <Icon size={16} style={{ color: config.color }} />
        </div>
        {config.metricKey && (
          <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', colors.text, colors.bg, colors.border)}>
            {statusLabels[status]}
          </span>
        )}
      </div>
      <p className="mono text-2xl font-semibold text-slate-100">
        {displayValue !== null && displayValue !== undefined ? displayValue : '—'}
      </p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-slate-500">{config.unit}</p>
        <p className="text-xs text-slate-500">{config.label}</p>
      </div>
    </motion.div>
  )
}

export default function VitalsLatestCard({ reading }) {
  return (
    <div>
      {reading?.recordedAt && (
        <p className="text-xs text-slate-500 mb-3">
          Last recorded: <span className="text-slate-400">{fDateTime(reading.recordedAt)}</span>
          {reading.recordedBy && <span> · {reading.recordedBy.name}</span>}
          {reading.hospital && <span className="text-blue-400/80"> · {reading.hospital.name}</span>}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {vitalsConfig.map((config, i) => (
          <VitalCard key={config.key} config={config} reading={reading} index={i} />
        ))}
      </div>
      {reading?.notes && (
        <div className="mt-3 p-3 rounded-xl text-sm text-slate-400" style={{ background: 'rgba(30,58,95,0.2)', border: '1px solid rgba(30,58,95,0.3)' }}>
          <span className="text-slate-500 text-xs uppercase tracking-wide mr-2">Notes:</span>
          {reading.notes}
        </div>
      )}
    </div>
  )
}
