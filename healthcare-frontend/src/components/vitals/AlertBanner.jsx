import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

export default function AlertBanner({ alerts = [], onDismiss }) {
  const hasCritical = alerts.some((a) => a.severity === 'critical')

  return (
    <div className="space-y-3">
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        hasCritical
          ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
      }`}>
        {hasCritical
          ? <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5 animate-pulse" />
          : <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />}
        <div>
          <p className="font-semibold text-sm">
            {hasCritical ? '🚨 Critical vitals detected!' : '⚠️ Abnormal vitals detected'}
          </p>
          <p className="text-xs opacity-80 mt-0.5">
            Vitals have been saved. Please review the alerts below.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border text-sm ${
              alert.severity === 'critical'
                ? 'bg-rose-500/8 border-rose-500/30'
                : 'bg-amber-500/8 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-medium text-xs uppercase tracking-wide ${
                alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {alert.label}
              </span>
              <span className={`mono text-sm font-semibold ${
                alert.severity === 'critical' ? 'text-rose-300' : 'text-amber-300'
              }`}>
                {alert.value} {alert.unit}
              </span>
            </div>
            <p className="text-slate-400 text-xs">{alert.message}</p>
            <p className="text-slate-500 text-xs mt-0.5">Normal: {alert.normalRange}</p>
          </div>
        ))}
      </div>

      <button onClick={onDismiss} className="btn-primary w-full mt-2">
        <CheckCircle size={15} />
        Acknowledge & Close
      </button>
    </div>
  )
}
