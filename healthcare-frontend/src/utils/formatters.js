import { format, formatDistanceToNow, parseISO, differenceInYears } from 'date-fns'
import { NORMAL_RANGES } from './constants'

export const fDate = (date) => {
  if (!date) return '—'
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM yyyy')
  } catch { return '—' }
}

export const fDateTime = (date) => {
  if (!date) return '—'
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM yyyy, hh:mm a')
  } catch { return '—' }
}

export const fTime = (date) => {
  if (!date) return '—'
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'hh:mm a')
  } catch { return '—' }
}

export const fChartDate = (date) => {
  if (!date) return ''
  try {
    return format(typeof date === 'string' ? parseISO(date) : date, 'dd MMM')
  } catch { return '' }
}

export const fRelative = (date) => {
  if (!date) return '—'
  try {
    return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true })
  } catch { return '—' }
}

export const fAge = (dob) => {
  if (!dob) return '—'
  try {
    return differenceInYears(new Date(), typeof dob === 'string' ? parseISO(dob) : dob) + ' yrs'
  } catch { return '—' }
}

export const fBP = (systolic, diastolic) => {
  if (!systolic || !diastolic) return '—'
  return `${systolic}/${diastolic}`
}

export const getVitalStatus = (metric, value) => {
  if (value === null || value === undefined) return 'unknown'
  const range = NORMAL_RANGES[metric]
  if (!range) return 'unknown'
  if (value < range.criticalMin || value > range.criticalMax) return 'critical'
  if (value < range.min || value > range.max) return 'warning'
  return 'normal'
}

export const getVitalStatusColor = (status) => {
  switch (status) {
    case 'normal': return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' }
    case 'warning': return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' }
    case 'critical': return { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/40' }
    default: return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/30' }
  }
}

export const getSeverityColor = (severity) => {
  switch (severity) {
    case 'severe': return { text: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/30' }
    case 'moderate': return { text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/30' }
    case 'mild': return { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30' }
    default: return { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/30' }
  }
}

export const getUrgencyConfig = (urgency) => {
  switch (urgency) {
    case 'critical':
      return { label: 'Critical — Immediate clinical attention required', color: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-400' }
    case 'urgent':
      return { label: 'Urgent — Clinical review recommended within 24–48 hours', color: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/40', text: 'text-orange-400' }
    case 'follow-up-soon':
      return { label: 'Follow-up Soon — Schedule within 1–2 weeks', color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400' }
    default:
      return { label: 'Routine — No immediate action required', color: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400' }
  }
}

export const getTrendConfig = (trend) => {
  switch (trend) {
    case 'stable': return { label: 'Stable', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
    case 'improving': return { label: 'Improving', color: 'text-blue-400', bg: 'bg-blue-400/10' }
    case 'worsening': return { label: 'Worsening', color: 'text-rose-400', bg: 'bg-rose-400/10' }
    case 'fluctuating': return { label: 'Fluctuating', color: 'text-amber-400', bg: 'bg-amber-400/10' }
    default: return { label: 'Insufficient Data', color: 'text-slate-400', bg: 'bg-slate-400/10' }
  }
}
