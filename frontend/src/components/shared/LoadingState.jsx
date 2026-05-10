import { cn } from '@/utils/cn'

function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-slate-100">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  )
}

export function LoadingState({ className }) {
  return (
    <div className={cn('space-y-4', className)}>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}
