import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Phone, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PledgeStatusBadge } from '@/components/shared/PledgeStatusBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { getPledges } from '@/services/endpoints/donor'
import { cancelPledge } from '@/services/endpoints/pledge'
import { PLEDGE_CANCEL } from '@/lib/enums'
import { formatDistanceToNow, format } from 'date-fns'

const CANCEL_CATS = [
  { value: PLEDGE_CANCEL.SCHEDULE_CONFLICT, label: 'Schedule conflict' },
  { value: PLEDGE_CANCEL.HEALTH, label: 'Health issue' },
  { value: PLEDGE_CANCEL.DISTANCE, label: 'Distance / travel' },
  { value: PLEDGE_CANCEL.REQUEST_FULFILLED, label: 'Request already fulfilled' },
  { value: PLEDGE_CANCEL.OTHER, label: 'Other' },
]

export default function DonorPledges() {
  const qc = useQueryClient()
  const [cancelTarget, setCancelTarget] = useState(null)

  const { data: activePledges, isLoading: aL, error: aE, refetch: aR } = useQuery({
    queryKey: ['donor', 'pledges', { status: 'ACCEPTED' }],
    queryFn: () => getPledges({ status: 'ACCEPTED' }),
  })

  const { data: historyPledges, isLoading: hL, error: hE, refetch: hR } = useQuery({
    queryKey: ['donor', 'pledges', { status: 'history' }],
    queryFn: () => getPledges({}),
  })

  const { mutate: doCancel, isPending } = useMutation({
    mutationFn: ({ id, body }) => cancelPledge(id, body),
    onSuccess: () => {
      toast.success('Pledge cancelled.')
      setCancelTarget(null)
      qc.invalidateQueries({ queryKey: ['donor', 'pledges'] })
      qc.invalidateQueries({ queryKey: ['donor', 'profile'] })
    },
    onError: (err) => toast.error(err.message),
  })

  const active = activePledges?.pledges ?? activePledges ?? []
  const history = (historyPledges?.pledges ?? historyPledges ?? []).filter(
    (p) => p.status !== 'ACCEPTED'
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">My Pledges</h1>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {aL && <LoadingState />}
            {aE && <ErrorState message={aE.message} onRetry={aR} />}
            {!aL && !aE && active.length === 0 && (
              <EmptyState title="No active pledges" description="Accept a request from the feed to get started." />
            )}
            {!aL && !aE && active.map((pledge) => (
              <PledgeCard
                key={pledge._id}
                pledge={pledge}
                onCancel={() => setCancelTarget(pledge._id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="history">
            {hL && <LoadingState />}
            {hE && <ErrorState message={hE.message} onRetry={hR} />}
            {!hL && !hE && history.length === 0 && (
              <EmptyState title="No pledge history yet" />
            )}
            {!hL && !hE && history.map((pledge) => (
              <PledgeCard key={pledge._id} pledge={pledge} />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <ReasonDialog
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelTarget(null)}
        title="Cancel pledge"
        description="Please let us know why you're cancelling so the hospital can plan."
        categories={CANCEL_CATS}
        reasonLabel="Additional notes"
        submitLabel="Cancel pledge"
        loading={isPending}
        onSubmit={({ category, reason }) =>
          doCancel({ id: cancelTarget, body: { category, note: reason } })
        }
      />
    </AppShell>
  )
}

function PledgeCard({ pledge, onCancel }) {
  const req = pledge.request
  const isActive = pledge.status === 'ACCEPTED'
  const isTerminal = ['FULFILLED', 'CANCELLED', 'NO_SHOW', 'VOID'].includes(pledge.status)

  return (
    <Card className={`mt-3 ${isTerminal ? 'opacity-70' : ''}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            {req && (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <BloodGroupBadge group={req.bloodGroup} />
                  <PledgeStatusBadge status={pledge.status} />
                </div>
                <p className="text-sm font-medium text-slate-800">
                  {req.hospital?.name ?? 'Hospital'}
                </p>
                {isActive && req.hospital?.phone && (
                  <a
                    href={`tel:${req.hospital.phone}`}
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {req.hospital.phone}
                  </a>
                )}
                <p className="text-xs text-slate-400">
                  Pledged {formatDistanceToNow(new Date(pledge.createdAt), { addSuffix: true })}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 items-end">
            {req && (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/seeker/requests/${req._id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            {isActive && onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}
                className="border-red-200 text-red-600 hover:bg-red-50">
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
