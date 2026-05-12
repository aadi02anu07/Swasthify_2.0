import { Stethoscope, Scissors, AlertTriangle, Pill, FlaskConical, Shield, Scan } from 'lucide-react'

const config = {
  diagnosis:   { Icon: Stethoscope, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  surgery:     { Icon: Scissors,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  allergy:     { Icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  medication:  { Icon: Pill,        color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  lab_result:  { Icon: FlaskConical, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  vaccination: { Icon: Shield,      color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  imaging:     { Icon: Scan,        color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
}

export default function RecordTypeIcon({ type, size = 18 }) {
  const cfg = config[type] || config.diagnosis
  const { Icon, color, bg } = cfg
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
      <Icon size={size} style={{ color }} />
    </div>
  )
}

export { config as recordTypeConfig }
