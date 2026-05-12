import { cn } from '@/utils/cn'

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div className={cn('relative', sizes[size], className)}>
      <div className={cn('absolute inset-0 rounded-full border-2 border-blue-500/20')} />
      <div className={cn('absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin')} />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-navy-900">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  )
}
