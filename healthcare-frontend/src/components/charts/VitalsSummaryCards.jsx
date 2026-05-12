import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const MetricCard = ({ label, avg, min, max, unit, color }) => (
  <div className="glass-card p-4">
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">{label}</p>
    <div className="text-center mb-3">
      <span className="mono text-2xl font-semibold" style={{ color }}>{avg ?? '—'}</span>
      <span className="text-slate-500 text-xs ml-1">{unit}</span>
      <p className="text-xs text-slate-500 mt-0.5">avg</p>
    </div>
    <div className="flex justify-between text-xs">
      <div className="text-center">
        <p className="text-slate-500">Min</p>
        <p className="mono text-slate-300">{min ?? '—'}</p>
      </div>
      <div className="text-center">
        <p className="text-slate-500">Max</p>
        <p className="mono text-slate-300">{max ?? '—'}</p>
      </div>
    </div>
  </div>
)

export default function VitalsSummaryCards({ summary }) {
  if (!summary) return null
  const { averages, ranges } = summary

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard label="Heart Rate" avg={averages?.heartRate?.toFixed(0)} min={ranges?.heartRate?.min} max={ranges?.heartRate?.max} unit="bpm" color="#f43f5e" />
      <MetricCard label="Systolic BP" avg={averages?.bpSystolic?.toFixed(0)} min={ranges?.bpSystolic?.min} max={ranges?.bpSystolic?.max} unit="mmHg" color="#3b82f6" />
      <MetricCard label="Diastolic BP" avg={averages?.bpDiastolic?.toFixed(0)} min={ranges?.bpDiastolic?.min} max={ranges?.bpDiastolic?.max} unit="mmHg" color="#10b981" />
      <MetricCard label="Blood Sugar" avg={averages?.sugar?.toFixed(0)} min={ranges?.sugar?.min} max={ranges?.sugar?.max} unit="mg/dL" color="#f59e0b" />
      <MetricCard label="SpO₂" avg={averages?.spo2?.toFixed(1)} min={ranges?.spo2?.min} max={ranges?.spo2?.max} unit="%" color="#8b5cf6" />
      <MetricCard label="Temperature" avg={averages?.temperature?.toFixed(1)} min={null} max={null} unit="°C" color="#06b6d4" />
    </div>
  )
}
