import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Stepper({ steps, currentStep, className }) {
  return (
    <nav className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep

        return (
          <div key={step} className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                isCompleted && 'bg-brand-600 text-white',
                isActive && 'bg-brand-600 text-white ring-2 ring-brand-200',
                !isCompleted && !isActive && 'bg-slate-200 text-slate-500'
              )}
            >
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span
              className={cn(
                'hidden sm:block text-sm font-medium truncate',
                isActive ? 'text-slate-900' : 'text-slate-500'
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={cn('h-px flex-1 mx-1', isCompleted ? 'bg-brand-400' : 'bg-slate-200')} />
            )}
          </div>
        )
      })}
    </nav>
  )
}
