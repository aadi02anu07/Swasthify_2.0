import { cn } from '@/utils/cn'

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-navy-700/50 border border-navy-600/40 flex items-center justify-center mb-4">
          <Icon size={24} className="text-slate-500" />
        </div>
      )}
      <p className="text-slate-300 font-medium mb-1">{title}</p>
      {description && <p className="text-slate-500 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
