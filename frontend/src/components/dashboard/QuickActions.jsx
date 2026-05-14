import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, ClipboardList } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/context/AuthContext'

const DONOR_ACTIONS = [
  { label: 'Browse Requests', to: '/donor/feed', icon: Search, color: 'bg-brand-50 text-brand-700 hover:bg-brand-100' },
  { label: 'My Pledges', to: '/donor/pledges', icon: ClipboardList, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
]

const HOSPITAL_ACTIONS = [
  { label: 'Record Donation', to: '/hospital/donations/new', icon: PlusCircle, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Verify Queue', to: '/hospital/queue', icon: ClipboardList, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
]

const SEEKER_ACTIONS = [
  { label: 'New Request', to: '/seeker/requests/new', icon: PlusCircle, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'My Requests', to: '/seeker/requests', icon: ClipboardList, color: 'bg-brand-50 text-brand-700 hover:bg-brand-100' },
]

export function QuickActions() {
  const { isHospital, mode } = useAuth()

  const actions = isHospital ? HOSPITAL_ACTIONS : mode === 'seeker' ? SEEKER_ACTIONS : DONOR_ACTIONS

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <motion.div
          key={a.to}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.3 }}
        >
          <Link
            to={a.to}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              a.color
            )}
          >
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
