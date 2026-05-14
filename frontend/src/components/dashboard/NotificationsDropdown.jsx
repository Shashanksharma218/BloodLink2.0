import { useState } from 'react'
import { Bell, HeartPulse, ClipboardList, Award } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { getPledges } from '@/services/endpoints/donor'
import { getHospitalDonations } from '@/services/endpoints/hospital'
import { cn } from '@/utils/cn'

function useDonorNotifications() {
  const { data } = useQuery({
    queryKey: ['donor', 'pledges', { limit: 5 }],
    queryFn: () => getPledges({ limit: 5 }),
    staleTime: 30_000,
  })
  const pledges = data?.pledges ?? data ?? []
  return pledges.slice(0, 5).map((p) => ({
    id: p._id,
    icon: HeartPulse,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    title: `Pledge ${p.status?.toLowerCase() ?? 'updated'}`,
    description: p.request?.bloodGroup ? `${p.request.bloodGroup} — ${p.request.hospital?.name ?? ''}` : 'Blood request pledge',
    time: p.updatedAt ?? p.createdAt,
  }))
}

function useHospitalNotifications() {
  const { data } = useQuery({
    queryKey: ['hospital', 'donations', { limit: 5 }],
    queryFn: () => getHospitalDonations({ limit: 5 }),
    staleTime: 30_000,
  })
  const donations = data?.donations ?? []
  return donations.slice(0, 5).map((d) => ({
    id: d._id,
    icon: ClipboardList,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: `Donation ${d.state?.toLowerCase() ?? 'recorded'}`,
    description: d.donor?.name ?? 'Walk-in donor',
    time: d.updatedAt ?? d.createdAt,
  }))
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const { isHospital } = useAuth()

  const donorNotes = useDonorNotifications()
  const hospitalNotes = useHospitalNotifications()
  const notifications = isHospital ? hospitalNotes : donorNotes

  const hasUnread = notifications.length > 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-slate-500" />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Recent Activity</p>
              </div>

              {!notifications.length ? (
                <div className="py-8 text-center text-sm text-slate-400">All caught up!</div>
              ) : (
                <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', n.iconBg)}>
                        <n.icon className={cn('h-3.5 w-3.5', n.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        {n.description && (
                          <p className="text-xs text-slate-500 truncate">{n.description}</p>
                        )}
                        {n.time && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
