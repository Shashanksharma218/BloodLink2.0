import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Phone, PlusCircle, CheckSquare } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { PledgeStatusBadge } from '@/components/shared/PledgeStatusBadge'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { getHospitalRequests, getRequestPledges, markNoShow } from '@/services/endpoints/hospital'
import { formatDistanceToNow } from 'date-fns'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

export default function HospitalActive() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hospital', 'requests', { active: true }],
    queryFn: () => getHospitalRequests({ status: 'VERIFIED,PARTIALLY_FULFILLED', limit: 50 }),
    staleTime: 0,
  })

  const requests = data?.requests ?? data ?? []

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div {...MOTION_FADE_UP} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <CheckSquare className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Active Requests</h1>
            <p className="text-sm text-slate-500">{requests.length} request{requests.length !== 1 ? 's' : ''} in progress</p>
          </div>
        </motion.div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyMascot
            title="No active requests"
            description="Verified requests with pledged donors will appear here."
          />
        )}

        {!isLoading && !isError && (
          <div className="space-y-3">
            {requests.map((req, i) => (
              <motion.div key={req._id} {...MOTION_FADE_UP} {...staggerChild(i)}>
                <RequestRow req={req} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function RequestRow({ req }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [noShowTarget, setNoShowTarget] = useState(null)
  const qc = useQueryClient()

  const fulfilled = req.unitsFulfilled ?? 0
  const total = req.unitsRequired ?? 1
  const pct = Math.min(100, Math.round((fulfilled / total) * 100))

  const { data: pledgesData, isLoading: pLoading } = useQuery({
    queryKey: ['hospital', 'request-pledges', req._id],
    queryFn: () => getRequestPledges(req._id),
    enabled: expanded,
  })
  const pledges = pledgesData?.pledges ?? pledgesData ?? []

  const { mutate: doNoShow, isPending } = useMutation({
    mutationFn: ({ id, note }) => markNoShow(id, { note }),
    onSuccess: () => {
      toast.success('Pledge marked as no-show.')
      setNoShowTarget(null)
      qc.invalidateQueries({ queryKey: ['hospital', 'request-pledges', req._id] })
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              <RequestStatusBadge status={req.status} />
            </div>
            <p className="text-sm font-semibold text-slate-800">{req.patient?.name}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {fulfilled}/{total} units
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Due {req.requiredBy ? formatDistanceToNow(new Date(req.requiredBy), { addSuffix: true }) : '—'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Pledges
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 space-y-2.5">
              {pLoading && <p className="text-xs text-slate-400">Loading pledges…</p>}
              {!pLoading && pledges.length === 0 && (
                <p className="text-xs text-slate-400">No pledges yet.</p>
              )}
              {pledges.map((pledge) => (
                <div key={pledge._id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold shrink-0">
                      {pledge.donor?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <p className="font-medium text-slate-700">{pledge.donor?.name}</p>
                    <PledgeStatusBadge status={pledge.status} />
                    {pledge.donor?.phone && (
                      <a href={`tel:${pledge.donor.phone}`}
                        className="text-xs text-brand-600 flex items-center gap-0.5 hover:underline">
                        <Phone className="h-3 w-3" />{pledge.donor.phone}
                      </a>
                    )}
                  </div>
                  {pledge.status === 'ACCEPTED' && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(`/hospital/donations/new?pledgeId=${pledge._id}`)}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Record
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 h-7 text-xs"
                        onClick={() => setNoShowTarget(pledge._id)}
                      >
                        No-show
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReasonDialog
        open={!!noShowTarget}
        onOpenChange={(v) => !v && setNoShowTarget(null)}
        title="Mark as no-show"
        description="The donor did not arrive. Optionally provide a note."
        reasonLabel="Note (optional)"
        submitLabel="Confirm no-show"
        loading={isPending}
        onSubmit={({ reason }) => doNoShow({ id: noShowTarget, note: reason })}
      />
    </div>
  )
}
