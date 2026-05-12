import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 500, marginBottom: 2 }}>
          {p.name}: {p.value} <span style={{ fontSize: 11, color: '#64748b' }}>mmHg</span>
        </p>
      ))}
    </div>
  )
}

export default function BloodPressureChart({ data }) {
  if (!data?.length) return <div className="h-44 flex items-center justify-center text-slate-500 text-sm">No data</div>
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.3)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={90} stroke="rgba(30,58,95,0.5)" strokeDasharray="4 4" />
        <ReferenceLine y={140} stroke="rgba(30,58,95,0.5)" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="bpSystolic" stroke="#3b82f6" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} name="Systolic" />
        <Line type="monotone" dataKey="bpDiastolic" stroke="#10b981" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} name="Diastolic" />
      </LineChart>
    </ResponsiveContainer>
  )
}
