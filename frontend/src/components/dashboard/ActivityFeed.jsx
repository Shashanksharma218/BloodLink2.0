import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/utils/cn'

export function ActivityFeed({ items = [], emptyText = 'No recent activity' }) {
  if (!items.length) {
    return <p className="text-sm text-slate-400 py-4 text-center">{emptyText}</p>
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => (
        <ActivityItem key={item.id ?? i} item={item} index={i} isLast={i === items.length - 1} />
      ))}
    </ol>
  )
}

function ActivityItem({ item, index, isLast }) {
  const { icon: Icon, iconBg = 'bg-brand-100', iconColor = 'text-brand-600', title, description, time } = item

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="relative flex gap-3 pl-2"
    >
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-5 top-8 bottom-0 w-px bg-slate-100" />
      )}

      {/* Icon dot */}
      <div className={cn('relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', iconBg)}>
        {Icon && <Icon className={cn('h-3.5 w-3.5', iconColor)} />}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <p className="text-sm font-medium text-slate-800 leading-snug">{title}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500 truncate">{description}</p>}
        {time && (
          <p className="mt-1 text-xs text-slate-400">
            {formatDistanceToNow(new Date(time), { addSuffix: true })}
          </p>
        )}
      </div>
    </motion.li>
  )
}
