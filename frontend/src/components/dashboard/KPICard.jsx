import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { SparkLine } from './charts/SparkLine'
import { HOVER_LIFT } from './theme'

function AnimatedNumber({ value, className }) {
  const prefersReduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    if (prefersReduced) { mv.set(value); return }
    const c = animate(mv, value, { duration: 1.2, ease: 'easeOut' })
    return c.stop
  }, [value, mv, prefersReduced])

  return <motion.span className={className}>{display}</motion.span>
}

export function KPICard({
  title,
  value = 0,
  delta,
  deltaLabel,
  icon,
  sparkData,
  accentColor = '#be123c',
  accentBg = 'bg-brand-50',
  href,
  className,
  suffix = '',
}) {
  const isPositive = delta > 0
  const isNeutral = delta === 0 || delta == null

  const card = (
    <motion.div
      {...HOVER_LIFT}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm cursor-default',
        href && 'cursor-pointer',
        className
      )}
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full" style={{ background: accentColor }} />

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 truncate">{title}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <AnimatedNumber value={value} className="text-2xl font-bold text-slate-900" />
              {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
            </div>
          </div>
          {icon && (
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl shrink-0', accentBg)}>
              {icon}
            </div>
          )}
        </div>

        {delta != null && (
          <div className="mt-2 flex items-center gap-1">
            {isNeutral ? (
              <Minus className="h-3 w-3 text-slate-400" />
            ) : isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              'text-xs font-medium',
              isNeutral ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-red-500'
            )}>
              {isNeutral ? '—' : `${isPositive ? '+' : ''}${delta}%`}
            </span>
            {deltaLabel && <span className="text-xs text-slate-400">{deltaLabel}</span>}
          </div>
        )}
      </div>

      {sparkData?.length > 1 && (
        <div className="px-2 pb-2">
          <SparkLine data={sparkData} color={accentColor} />
        </div>
      )}
    </motion.div>
  )

  if (href) {
    return (
      <a href={href} className="block no-underline">
        {card}
      </a>
    )
  }
  return card
}
