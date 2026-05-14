import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { MOTION_FADE_UP } from './theme'

export function SectionCard({
  title,
  action,
  actionTo,
  children,
  className,
  noPadding = false,
  accentColor = '#be123c',
}) {
  return (
    <motion.div
      {...MOTION_FADE_UP}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      {/* Decorative blob */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 blur-2xl"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      {/* Header */}
      {(title || action) && (
        <div className="relative flex items-center justify-between px-5 pt-5 pb-3">
          {title && (
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          )}
          {action && actionTo && (
            <Link
              to={actionTo}
              className="flex items-center gap-0.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              {action}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      <div className={cn('relative', !noPadding && 'px-5 pb-5')}>
        {children}
      </div>
    </motion.div>
  )
}
