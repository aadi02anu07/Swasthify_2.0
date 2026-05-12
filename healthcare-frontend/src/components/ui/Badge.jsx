import { cn } from '@/utils/cn'

const variants = {
  normal:   'bg-emerald-400/10 text-emerald-400 border border-emerald-500/30',
  warning:  'bg-amber-400/10   text-amber-400   border border-amber-500/30',
  critical: 'bg-rose-400/10   text-rose-400   border border-rose-500/30',
  blue:     'bg-blue-400/10   text-blue-400   border border-blue-500/30',
  violet:   'bg-violet-400/10 text-violet-400 border border-violet-500/30',
  slate:    'bg-slate-400/10  text-slate-400  border border-slate-500/30',
  emerald:  'bg-emerald-400/10 text-emerald-400 border border-emerald-500/30',
  amber:    'bg-amber-400/10   text-amber-400   border border-amber-500/30',
  rose:     'bg-rose-400/10   text-rose-400   border border-rose-500/30',
  teal:     'bg-teal-400/10   text-teal-400   border border-teal-500/30',
  indigo:   'bg-indigo-400/10 text-indigo-400 border border-indigo-500/30',
  orange:   'bg-orange-400/10 text-orange-400 border border-orange-500/30',
  pending:  'bg-amber-400/10   text-amber-400   border border-amber-500/30',
  confirmed:'bg-blue-400/10   text-blue-400   border border-blue-500/30',
  completed:'bg-emerald-400/10 text-emerald-400 border border-emerald-500/30',
  cancelled:'bg-rose-400/10   text-rose-400   border border-rose-500/30',
}

export default function Badge({ variant = 'slate', children, className, dot = false }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[variant] || variants.slate,
      className
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
