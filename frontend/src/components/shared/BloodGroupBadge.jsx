import { cn } from '@/utils/cn'

const COLOR_MAP = {
  'A+': 'bg-red-50 text-red-700 border-red-200',
  'A-': 'bg-red-50 text-red-700 border-red-200',
  'B+': 'bg-blue-50 text-blue-700 border-blue-200',
  'B-': 'bg-blue-50 text-blue-700 border-blue-200',
  'O+': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'O-': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'AB+': 'bg-purple-50 text-purple-700 border-purple-200',
  'AB-': 'bg-purple-50 text-purple-700 border-purple-200',
}

export function BloodGroupBadge({ group, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold',
        COLOR_MAP[group] ?? 'bg-slate-100 text-slate-600 border-slate-200',
        className
      )}
    >
      {group}
    </span>
  )
}
