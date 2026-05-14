import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { getDonorFeed } from '@/services/endpoints/feed'
import { acceptPledge } from '@/services/endpoints/pledge'
import { URGENCY } from '@/lib/enums'
import { MOTION_FADE_UP } from '@/components/dashboard/theme'

const URGENCY_FILTERS = [
  { label: 'Any', value: '' },
  { label: '🔴 Critical', value: URGENCY.CRITICAL },
  { label: '🟠 High', value: URGENCY.HIGH },
  { label: '🟢 Normal', value: URGENCY.NORMAL },
]

const URGENCY_BORDER = {
  CRITICAL: 'border-l-red-500',
  HIGH: 'border-l-orange-400',
  NORMAL: 'border-l-emerald-400',
}

export default function DonorFeed() {
  const qc = useQueryClient()
  const [urgency, setUrgency] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['donor', 'feed', { urgency, page }],
    queryFn: () => getDonorFeed({ urgency: urgency || undefined, page, limit: 10 }),
    staleTime: 0,
  })

  const requests = data?.requests ?? data ?? []
  const meta = data?.meta ?? {}

  const { mutate: accept, isPending } = useMutation({
    mutationFn: acceptPledge,
    onSuccess: () => {
      toast.success('Pledge accepted! The hospital will see you shortly.')
      qc.invalidateQueries({ queryKey: ['donor', 'feed'] })
      qc.invalidateQueries({ queryKey: ['donor', 'pledges'] })
      qc.invalidateQueries({ queryKey: ['donor', 'profile'] })
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div {...MOTION_FADE_UP} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Matched Requests</h1>
            <p className="mt-1 text-sm text-slate-500">Blood requests matching your blood group and area</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs font-medium text-brand-700">{meta.total ?? 0} matches</span>
          </div>
        </motion.div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {URGENCY_FILTERS.map((f) => (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setUrgency(f.value); setPage(1) }}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                urgency === f.value
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyMascot
            title="No matching requests right now"
            description="No blood requests match your group and area at the moment. Check back later."
          />
        )}

        <AnimatePresence mode="wait">
          {!isLoading && !isError && requests.length > 0 && (
            <motion.div
              key={`${urgency}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {requests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <RequestCard req={req} onAccept={() => accept(req._id)} loading={isPending} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Pagination page={page} total={meta.total ?? 0} limit={10} onPageChange={setPage} />
      </div>
    </AppShell>
  )
}

function RequestCard({ req, onAccept, loading }) {
  const timeLeft = req.requiredBy
    ? formatDistanceToNow(new Date(req.requiredBy), { addSuffix: true })
    : null

  const borderColor = URGENCY_BORDER[req.urgency] ?? 'border-l-slate-300'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden border-l-4 ${borderColor}`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              {timeLeft && (
                <Badge variant={req.urgency === 'CRITICAL' ? 'danger' : 'default'} className="text-xs">
                  Due {timeLeft}
                </Badge>
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                {req.patient?.name ?? 'Patient'}
                {req.patient?.age ? ` · ${req.patient.age}y` : ''}
                {req.patient?.gender ? ` · ${req.patient.gender}` : ''}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''} needed
              </p>
            </div>

            {req.hospital && (
              <div className="flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
                <span className="truncate">{req.hospital.name} · {req.hospital.address} · {req.hospital.pincode}</span>
              </div>
            )}
          </div>

          <Button size="sm" onClick={onAccept} disabled={loading} className="shrink-0 mt-1">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Accept
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
