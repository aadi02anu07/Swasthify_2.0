import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import RecordTypeIcon from './RecordTypeIcon'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { fDate } from '@/utils/formatters'
import { getSeverityColor } from '@/utils/formatters'
import { Clock } from 'lucide-react'

export default function Timeline({ timeline = [] }) {
  if (!timeline?.length) {
    return <EmptyState icon={Clock} title="No medical history" description="Records will appear here as they are added." />
  }

  return (
    <div className="space-y-8">
      {timeline.map((yearGroup, yi) => (
        <div key={yearGroup.year}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-7 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <span className="mono text-blue-400 text-xs font-semibold">{yearGroup.year}</span>
            </div>
            <div className="h-px flex-1 bg-navy-600/40" />
          </div>

          <div className="pl-4 border-l-2 border-navy-600/40 space-y-3">
            {yearGroup.records.map((record, ri) => {
              const sev = record.severity ? getSeverityColor(record.severity) : null
              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ri * 0.04 }}
                  className="relative glass-card p-4 -ml-px"
                  style={{ borderLeft: `3px solid ${sev ? '' : 'rgba(30,58,95,0.6)'}` }}
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-navy-600 border-2 border-navy-600" />

                  <div className="flex items-start gap-3">
                    <RecordTypeIcon type={record.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-slate-200 text-sm">{record.title}</p>
                          {record.description && (
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{record.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {record.severity && (
                            <Badge variant={record.severity === 'severe' ? 'rose' : record.severity === 'moderate' ? 'amber' : 'emerald'}>
                              {record.severity}
                            </Badge>
                          )}
                          <Badge variant="slate">{record.type?.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <p className="text-xs text-slate-500">{fDate(record.occurredAt)}</p>
                        {record.hospital?.name && (
                          <p className="text-xs text-blue-400/70">{record.hospital.name}</p>
                        )}
                        {record.recordedBy?.name && (
                          <p className="text-xs text-slate-500">by {record.recordedBy.name}</p>
                        )}
                        {record.attachmentUrl && (
                          <a href={record.attachmentUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-400 flex items-center gap-1 hover:text-blue-300">
                            <ExternalLink size={11} /> Attachment
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
