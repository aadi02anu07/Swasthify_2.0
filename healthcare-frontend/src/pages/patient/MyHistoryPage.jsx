import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Loader2, Filter } from 'lucide-react'
import { getHistoryTimeline, getMedicalHistory } from '@/api/history'
import useAuthStore from '@/store/authStore'
import Timeline from '@/components/history/Timeline'
import EmptyState from '@/components/ui/EmptyState'
import { RECORD_TYPES } from '@/utils/constants'
import toast from 'react-hot-toast'

export default function MyHistoryPage() {
  const { user } = useAuthStore()
  const patientID = user?.patientID
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [stats, setStats] = useState({ total: 0 })

  useEffect(() => {
    if (!patientID) return
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [tlRes, histRes] = await Promise.all([
          getHistoryTimeline(patientID),
          getMedicalHistory(patientID, { limit: 1 }),
        ])
        setTimeline(tlRes.data.timeline || [])
        setStats({ total: histRes.data.pagination?.total || 0 })
      } catch { toast.error('Failed to load history') }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [patientID])

  const filteredTimeline = filterType
    ? timeline.map((yr) => ({
        ...yr,
        records: yr.records.filter((r) => r.type === filterType),
      })).filter((yr) => yr.records.length > 0)
    : timeline

  const totalRecords = timeline.reduce((s, yr) => s + yr.records.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Medical History</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {totalRecords} record{totalRecords !== 1 ? 's' : ''} across your lifetime
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field w-44 py-2 text-sm"
          >
            <option value="">All types</option>
            {RECORD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary chips */}
      {!loading && timeline.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
          {RECORD_TYPES.map((t) => {
            const count = timeline.reduce(
              (s, yr) => s + yr.records.filter((r) => r.type === t.value).length, 0
            )
            if (!count) return null
            return (
              <button
                key={t.value}
                onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  filterType === t.value
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                    : 'bg-navy-700/40 border-navy-600/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label} · {count}
              </button>
            )
          })}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-500" />
        </div>
      ) : filteredTimeline.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={filterType ? 'No records of this type' : 'No medical history'}
          description={filterType ? 'Try a different filter.' : 'Your medical records will appear here as hospitals add them.'}
        />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Timeline timeline={filteredTimeline} />
        </motion.div>
      )}
    </div>
  )
}
