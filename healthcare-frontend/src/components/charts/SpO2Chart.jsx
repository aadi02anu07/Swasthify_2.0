import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#8b5cf6', fontSize: 14, fontFamily: 'JetBrains Mono', fontWeight: 500 }}>
        {payload[0].value} <span style={{ fontSize: 11, color: '#64748b' }}>%</span>
      </p>
    </div>
  )
}

export default function SpO2Chart({ data }) {
  if (!data?.length) return <div className="h-44 flex items-center justify-center text-slate-500 text-sm">No data</div>
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.3)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} domain={[80, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={95} stroke="rgba(30,58,95,0.5)" strokeDasharray="4 4" />
        <Line type="monotone" dataKey="spo2" stroke="#8b5cf6" strokeWidth={2}
          dot={false} activeDot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
