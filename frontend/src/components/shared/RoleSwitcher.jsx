import { useAuth } from '@/context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'

export function RoleSwitcher() {
  const { isDonor, isSeeker, mode, setMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!isDonor || !isSeeker) return null

  const switchTo = (m) => {
    setMode(m)
    if (m === 'donor' && !location.pathname.startsWith('/donor')) navigate('/donor')
    if (m === 'seeker' && !location.pathname.startsWith('/seeker')) navigate('/seeker')
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
      <button
        onClick={() => switchTo('donor')}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          mode === 'donor'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        Donor
      </button>
      <button
        onClick={() => switchTo('seeker')}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          mode === 'seeker'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        Seeker
      </button>
    </div>
  )
}
