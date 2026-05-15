import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, BarChart3, AlertCircle, Lightbulb, Info, RefreshCw, Clock, Timer } from 'lucide-react'
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

const RETRY_COUNTDOWN_SEC = 30

export default function AIAnalysisPanel({ patientID }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  // error is now an object: { type: 'waking_up' | 'rate_limited' | 'failed', message: string }
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const lastTypeRef = useRef('vitals')     // remember which analysis was attempted
  const retryCountRef = useRef(0)          // track how many auto-retries we've done

  // Countdown timer — auto-retries once when it hits 0
  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          // Auto-retry once when countdown reaches 0
          if (retryCountRef.current < 1) {
            retryCountRef.current += 1
            runAnalysis(lastTypeRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [countdown]) // eslint-disable-line react-hooks/exhaustive-deps

  const runAnalysis = useCallback(async (type) => {
    lastTypeRef.current = type
    setLoading(true)
    setAnalysis(null)
    setError(null)
    setCountdown(0)

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
      retryCountRef.current = 0 // reset on success
      toast.success('Analysis complete')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message

      if (status === 502 || status === 503 || status === 504) {
        setError({ type: 'waking_up', message: msg || 'Backend is waking up.' })
        // Only start countdown if we haven't auto-retried yet
        if (retryCountRef.current < 1) {
          setCountdown(RETRY_COUNTDOWN_SEC)
          toast.error('Backend is waking up — retrying in 30s…')
        } else {
          toast.error('AI service still unavailable — try again manually')
        }
      } else if (status === 429) {
        setError({ type: 'rate_limited', message: 'Rate limit reached — AI analysis is limited to 10 requests per 15 minutes. Please wait a few minutes and try again.' })
        toast.error('Rate limit reached')
      } else if (status === 403) {
        setError({ type: 'failed', message: 'AI analysis is restricted to clinical staff only.' })
        toast.error('Access restricted')
      } else {
        setError({ type: 'failed', message: msg || 'AI analysis failed. Please try again.' })
        toast.error(msg?.split('.')[0] || 'Analysis failed')
      }
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }, [patientID])

  const handleManualRetry = () => {
    retryCountRef.current = 0 // reset so countdown can fire again
    runAnalysis(lastTypeRef.current)
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
          onClick={() => { retryCountRef.current = 0; runAnalysis('vitals') }}
          disabled={loading}
          className="btn-primary flex-1 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <Zap size={15} />
          Analyze Vitals
        </button>
        <button
          onClick={() => { retryCountRef.current = 0; runAnalysis('chart') }}
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

        {/* Error: Backend waking up — with countdown */}
        {error?.type === 'waking_up' && !loading && (
          <motion.div key="waking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <Timer size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-300 font-medium text-sm mb-1">Backend is Waking Up</p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {countdown > 0
                    ? `The server is starting up after being idle. Retrying automatically in ${countdown}s…`
                    : retryCountRef.current >= 1
                      ? 'Auto-retry failed — the server may need more time. You can try again manually.'
                      : error.message
                  }
                </p>
                {/* Countdown progress bar */}
                {countdown > 0 && (
                  <div className="mt-3 h-1.5 rounded-full bg-navy-700/60 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: countdown, ease: 'linear' }}
                    />
                  </div>
                )}
                {/* Manual retry button — shown after auto-retry or when countdown is done */}
                {countdown === 0 && (
                  <button
                    onClick={handleManualRetry}
                    className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
                  >
                    <RefreshCw size={12} /> Try Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error: Rate limited */}
        {error?.type === 'rate_limited' && !loading && (
          <motion.div key="ratelimit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 rounded-2xl border border-violet-500/30 bg-violet-500/5">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-violet-300 font-medium text-sm mb-1">Rate Limit Reached</p>
                <p className="text-slate-400 text-sm leading-relaxed">{error.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error: Generic failure */}
        {error?.type === 'failed' && !loading && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-rose-300 font-medium text-sm mb-1">Analysis Failed</p>
                <p className="text-slate-400 text-sm leading-relaxed">{error.message}</p>
                <button
                  onClick={handleManualRetry}
                  className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
                >
                  <RefreshCw size={12} /> Try Again
                </button>
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
