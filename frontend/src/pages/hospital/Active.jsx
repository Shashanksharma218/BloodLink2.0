import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, Phone, PlusCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { PledgeStatusBadge } from '@/components/shared/PledgeStatusBadge'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { getHospitalRequests, getRequestPledges, markNoShow } from '@/services/endpoints/hospital'
import { formatDistanceToNow } from 'date-fns'

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
        <h1 className="text-2xl font-bold text-slate-900">Active Requests</h1>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyState title="No active requests" description="Verified requests with pledged donors will appear here." />
        )}

        {!isLoading && !isError && requests.map((req) => (
          <RequestRow key={req._id} req={req} />
        ))}
      </div>
    </AppShell>
  )
}

function RequestRow({ req }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [noShowTarget, setNoShowTarget] = useState(null)
  const qc = useQueryClient()

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
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              <RequestStatusBadge status={req.status} />
            </div>
            <p className="text-sm font-medium text-slate-800">{req.patient?.name}</p>
            <p className="text-xs text-slate-500">
              {req.unitsFulfilled ?? 0}/{req.unitsRequired} units ·{' '}
              Required {req.requiredBy ? formatDistanceToNow(new Date(req.requiredBy), { addSuffix: true }) : '—'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Pledges
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
            {pLoading && <p className="text-xs text-slate-400">Loading pledges...</p>}
            {!pLoading && pledges.length === 0 && (
              <p className="text-xs text-slate-400">No pledges yet.</p>
            )}
            {pledges.map((pledge) => (
              <div key={pledge._id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
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
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => navigate(`/hospital/donations/new?pledgeId=${pledge._id}`)}>
                      <PlusCircle className="h-3.5 w-3.5" />
                      Record
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      onClick={() => setNoShowTarget(pledge._id)}
                    >
                      No-show
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

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
    </Card>
  )
}
