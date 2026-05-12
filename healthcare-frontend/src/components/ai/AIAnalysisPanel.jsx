import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, BarChart3, AlertCircle, Lightbulb, Clock } from 'lucide-react'
import { analyzeVitals, analyzeChart } from '@/api/ai'
import { getUrgencyConfig, getTrendConfig } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const concernColors = {
  high: 'border-rose-500/30 bg-rose-500/5',
  moderate: 'border-amber-500/30 bg-amber-500/5',
  low: 'border-blue-500/20 bg-blue-500/5',
  none: 'border-navy-600/40 bg-transparent',
}

export default function AIAnalysisPanel({ patientID }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')

  const messages = [
    'Connecting to Gemini AI…',
    'Analyzing vitals trends…',
    'Reviewing medical history…',
    'Generating clinical insights…',
  ]

  const runAnalysis = async (type) => {
    setLoading(true)
    setAnalysis(null)
    let msgIdx = 0
    setLoadingMsg(messages[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length
      setLoadingMsg(messages[msgIdx])
    }, 1500)

    try {
      const res = type === 'vitals'
        ? await analyzeVitals(patientID)
        : await analyzeChart(patientID)
      setAnalysis(res.data.analysis)
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis failed. Rate limit may apply.')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const urgencyConfig = analysis ? getUrgencyConfig(analysis.urgency) : null

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => runAnalysis('vitals')}
          disabled={loading}
          className="btn-primary flex-1"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <Zap size={15} />
          Analyze Vitals
        </button>
        <button
          onClick={() => runAnalysis('chart')}
          disabled={loading}
          className="btn-primary flex-1"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0f766e)' }}
        >
          <BarChart3 size={15} />
          Full Chart Analysis
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <Brain size={28} className="text-violet-400" />
              </div>
              <div className="absolute -inset-2 rounded-2xl border border-violet-500/20 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 font-medium">AI Analysis in Progress</p>
              <p className="text-slate-500 text-sm mt-1">{loadingMsg}</p>
            </div>
            <Spinner />
          </motion.div>
        )}

        {analysis && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Urgency banner */}
            <div className={cn('p-4 rounded-xl border flex items-start gap-3', urgencyConfig.bg, urgencyConfig.border)}>
              <AlertCircle size={18} className={cn('shrink-0 mt-0.5', urgencyConfig.text)} />
              <div>
                <p className={cn('font-semibold text-sm', urgencyConfig.text)}>{urgencyConfig.label}</p>
                {analysis.urgencyReason && (
                  <p className="text-slate-400 text-xs mt-0.5">{analysis.urgencyReason}</p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Brain size={12} className="text-violet-400" /> Summary
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Trends */}
            {analysis.trends && (
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Vitals Trends</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.trends).map(([metric, trend]) => {
                    const tc = getTrendConfig(trend)
                    return (
                      <span key={metric} className={cn('px-3 py-1 rounded-full text-xs font-medium border', tc.color, tc.bg, 'border-current/20')}>
                        {metric.replace(/([A-Z])/g, ' $1').trim()}: {tc.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Observations */}
            {analysis.observations?.length > 0 && (
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Clinical Observations</p>
                <div className="grid gap-3">
                  {analysis.observations.map((obs, i) => (
                    <div key={i} className={cn('p-3 rounded-xl border text-sm', concernColors[obs.concern] || concernColors.none)}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-slate-200 text-xs">{obs.category}</p>
                        {obs.concern && obs.concern !== 'none' && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', {
                            'text-rose-400 bg-rose-400/10': obs.concern === 'high',
                            'text-amber-400 bg-amber-400/10': obs.concern === 'moderate',
                            'text-blue-400 bg-blue-400/10': obs.concern === 'low',
                          })}>
                            {obs.concern}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">{obs.finding}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestionsForDoctor?.length > 0 && (
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-emerald-400" /> Suggestions for Doctor
                </p>
                <ol className="space-y-2">
                  {analysis.suggestionsForDoctor.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <span className="mono text-emerald-400 text-xs shrink-0 mt-0.5 font-semibold">{String(i + 1).padStart(2, '0')}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Disclaimer */}
            {analysis.disclaimer && (
              <p className="text-xs text-slate-600 text-center px-4">{analysis.disclaimer}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
