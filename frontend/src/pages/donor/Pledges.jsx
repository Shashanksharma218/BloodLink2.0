import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Phone, ExternalLink, HeartPulse } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PledgeStatusBadge } from '@/components/shared/PledgeStatusBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { getPledges } from '@/services/endpoints/donor'
import { cancelPledge } from '@/services/endpoints/pledge'
import { PLEDGE_CANCEL } from '@/lib/enums'
import { formatDistanceToNow } from 'date-fns'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

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
  const history = (historyPledges?.pledges ?? historyPledges ?? []).filter((p) => p.status !== 'ACCEPTED')

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div {...MOTION_FADE_UP} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <HeartPulse className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Pledges</h1>
            <p className="text-sm text-slate-500">{active.length} active · {history.length} historical</p>
          </div>
        </motion.div>

        <Tabs defaultValue="active">
          <TabsList className="rounded-xl bg-slate-100">
            <TabsTrigger value="active" className="rounded-lg">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {aL && <LoadingState />}
            {aE && <ErrorState message={aE.message} onRetry={aR} />}
            {!aL && !aE && active.length === 0 && (
              <EmptyMascot
                title="No active pledges"
                description="Accept a request from the feed to get started."
                action="Browse requests"
                actionTo="/donor/feed"
              />
            )}
            {!aL && !aE && (
              <div className="space-y-3">
                {active.map((pledge, i) => (
                  <motion.div key={pledge._id} {...MOTION_FADE_UP} {...staggerChild(i)}>
                    <PledgeCard pledge={pledge} onCancel={() => setCancelTarget(pledge._id)} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {hL && <LoadingState />}
            {hE && <ErrorState message={hE.message} onRetry={hR} />}
            {!hL && !hE && history.length === 0 && (
              <EmptyMascot title="No pledge history yet" />
            )}
            {!hL && !hE && (
              <div className="space-y-3">
                {history.map((pledge, i) => (
                  <motion.div key={pledge._id} {...MOTION_FADE_UP} {...staggerChild(i)}>
                    <PledgeCard pledge={pledge} />
                  </motion.div>
                ))}
              </div>
            )}
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
    <motion.div
      whileHover={!isTerminal ? { y: -2 } : {}}
      transition={{ duration: 0.15 }}
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${
        isTerminal ? 'opacity-60' : ''
      } ${isActive ? 'border-l-4 border-l-brand-500' : ''}`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {req ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <BloodGroupBadge group={req.bloodGroup} />
                  <PledgeStatusBadge status={pledge.status} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{req.hospital?.name ?? 'Hospital'}</p>
                  {req.hospital?.address && (
                    <p className="text-xs text-slate-500 mt-0.5">{req.hospital.address}</p>
                  )}
                </div>
                {isActive && req.hospital?.phone && (
                  <a
                    href={`tel:${req.hospital.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    {req.hospital.phone}
                  </a>
                )}
                <p className="text-xs text-slate-400">
                  Pledged {formatDistanceToNow(new Date(pledge.createdAt), { addSuffix: true })}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Request details unavailable</p>
            )}
          </div>

          <div className="flex flex-col gap-2 items-end shrink-0">
            {req && (
              <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Link to={`/seeker/requests/${req._id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            {isActive && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-7"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
