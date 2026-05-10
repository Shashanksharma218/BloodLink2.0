import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getDonorFeed } from '@/services/endpoints/feed'
import { acceptPledge } from '@/services/endpoints/pledge'
import { URGENCY } from '@/lib/enums'

const URGENCY_FILTERS = [
  { label: 'Any', value: '' },
  { label: 'Critical', value: URGENCY.CRITICAL },
  { label: 'High', value: URGENCY.HIGH },
  { label: 'Normal', value: URGENCY.NORMAL },
]

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
    onSuccess: (_, requestId) => {
      toast.success('Pledge accepted! The hospital will see you shortly.')
      qc.invalidateQueries({ queryKey: ['donor', 'feed'] })
      qc.invalidateQueries({ queryKey: ['donor', 'pledges'] })
      qc.invalidateQueries({ queryKey: ['donor', 'profile'] })
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matched Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Blood requests matching your blood group and area</p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {URGENCY_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setUrgency(f.value); setPage(1) }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                urgency === f.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyState
            title="No matching requests"
            description="No blood requests matching your group and area right now. Check back later."
          />
        )}

        {!isLoading && !isError && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((req) => (
              <RequestCard
                key={req._id}
                req={req}
                onAccept={() => accept(req._id)}
                loading={isPending}
              />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          total={meta.total ?? 0}
          limit={10}
          onPageChange={setPage}
        />
      </div>
    </AppShell>
  )
}

function RequestCard({ req, onAccept, loading }) {
  const timeLeft = req.requiredBy
    ? formatDistanceToNow(new Date(req.requiredBy), { addSuffix: true })
    : null

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              {timeLeft && (
                <Badge variant={req.urgency === 'CRITICAL' ? 'danger' : 'default'}>
                  Required {timeLeft}
                </Badge>
              )}
            </div>

            <div>
              <p className="font-medium text-slate-800">
                {req.patient?.name ?? 'Patient'} · {req.patient?.age}y · {req.patient?.gender}
              </p>
              <p className="text-sm text-slate-500">
                {req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''} needed
              </p>
            </div>

            {req.hospital && (
              <div className="flex items-start gap-1 text-sm text-slate-600">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>{req.hospital.name} · {req.hospital.address} · {req.hospital.pincode}</span>
              </div>
            )}
          </div>

          <Button size="sm" onClick={onAccept} disabled={loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
