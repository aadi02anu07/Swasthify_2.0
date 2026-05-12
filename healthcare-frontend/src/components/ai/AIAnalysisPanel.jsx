import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, BarChart3, AlertCircle, Lightbulb, Info } from 'lucide-react'
import { analyzeVitals, analyzeChart } from '@/api/ai'
import { getUrgencyConfig, getTrendConfig } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const concernColors = {
  high:     'border-rose-500/30 bg-rose-500/5',
  moderate: 'border-amber-500/30 bg-amber-500/5',
  low:      'border-blue-500/20 bg-blue-500/5',
  none:     'border-navy-600/40 bg-transparent',
}

const loadingMessages = [
  'Connecting to Gemini AI…',
  'Analyzing vitals trends…',
  'Reviewing medical history…',
  'Generating clinical insights…',
]

export default function AIAnalysisPanel({ patientID }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)

  const runAnalysis = async (type) => {
    setLoading(true)
    setAnalysis(null)
    setError(null)

    let msgIdx = 0
    setLoadingMsg(loadingMessages[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length
      setLoadingMsg(loadingMessages[msgIdx])
    }, 1800)

    try {
      const res = type === 'vitals'
        ? await analyzeVitals(patientID)
        : await analyzeChart(patientID)
      setAnalysis(res.data.analysis)
      toast.success('Analysis complete')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message

      let friendlyError
      if (status === 429) {
        friendlyError = 'Rate limit reached — AI analysis is limited to 10 requests per 15 minutes. Please wait a few minutes and try again.'
      } else if (status === 503 || status === 502) {
        friendlyError = 'AI service is temporarily unavailable. The backend may still be waking up — try again in 30 seconds.'
      } else if (status === 403) {
        friendlyError = 'AI analysis is restricted to clinical staff only.'
      } else {
        friendlyError = msg || 'AI analysis failed. Please try again.'
      }

      setError(friendlyError)
      toast.error(friendlyError.split('.')[0]) // show first sentence in toast
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  const urgencyConfig = analysis ? getUrgencyConfig(analysis.urgency) : null

  return (
    <div className="space-y-4">
      {/* Info note */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs text-slate-400"
        style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <Info size={13} className="text-violet-400 shrink-0 mt-0.5" />
        <span>AI analysis is rate-limited to <strong className="text-slate-300">10 requests per 15 minutes</strong> per hospital to manage API costs. Results are cached for repeat requests on the same patient.</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => runAnalysis('vitals')}
          disabled={loading}
          className="btn-primary flex-1 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <Zap size={15} />
          Analyze Vitals
        </button>
        <button
          onClick={() => runAnalysis('chart')}
          disabled={loading}
          className="btn-primary flex-1 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1d4ed8, #0f766e)' }}
        >
          <BarChart3 size={15} />
          Full Chart Analysis
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading state */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-card p-10 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
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

        {/* Error state */}
        {error && !loading && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-rose-300 font-medium text-sm mb-1">Analysis Failed</p>
                <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
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
            {analysis.trends && Object.keys(analysis.trends).length > 0 && (
              <div className="glass-card p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Vitals Trends</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.trends).map(([metric, trend]) => {
                    const tc = getTrendConfig(trend)
                    return (
                      <span key={metric} className={cn('px-3 py-1 rounded-full text-xs font-medium border border-current/20', tc.color, tc.bg)}>
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
                      <p className="text-slate-400 text-xs leading-relaxed">{obs.finding}</p>
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
                <ol className="space-y-2.5">
                  {analysis.suggestionsForDoctor.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                      <span className="mono text-emerald-400 text-xs shrink-0 mt-0.5 font-semibold">{String(i + 1).padStart(2, '0')}</span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Disclaimer */}
            {analysis.disclaimer && (
              <p className="text-xs text-slate-600 text-center px-4 leading-relaxed">{analysis.disclaimer}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
