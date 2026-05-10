import { cn } from '@/utils/cn'

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'resize-none',
        className
      )}
      {...props}
    />
  )
}
