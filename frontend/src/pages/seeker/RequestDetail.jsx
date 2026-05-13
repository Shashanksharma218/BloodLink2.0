import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Phone, Mail, Lock, ArrowLeft, FileText } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { PledgeStatusBadge } from '@/components/shared/PledgeStatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getRequest, getRequestPledges, cancelRequest } from '@/services/endpoints/seeker'
import { REQUEST_STATUS } from '@/lib/enums'

const TERMINAL = [REQUEST_STATUS.FULFILLED, REQUEST_STATUS.REJECTED, REQUEST_STATUS.EXPIRED, REQUEST_STATUS.CANCELLED]

export default function SeekerRequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: req, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequest(id),
    staleTime: 0,
  })

  const { data: pledgesData } = useQuery({
    queryKey: ['seeker', 'pledges', id],
    queryFn: () => getRequestPledges(id),
    enabled: !!req,
    staleTime: 0,
  })

  const pledges = pledgesData?.pledges ?? pledgesData ?? []

  const { mutate: doCancel, isPending } = useMutation({
    mutationFn: ({ reason }) => cancelRequest(id, { reason }),
    onSuccess: () => {
      toast.success('Request cancelled.')
      setCancelOpen(false)
      qc.invalidateQueries({ queryKey: ['request', id] })
      qc.invalidateQueries({ queryKey: ['seeker', 'requests'] })
    },
    onError: (err) => toast.error(err.message),
  })

  if (isLoading) return <AppShell><LoadingState /></AppShell>
  if (isError) return <AppShell><ErrorState message={error.message} onRetry={refetch} /></AppShell>

  const isTerminal = TERMINAL.includes(req.status)
  const fulfilled = req.unitsFulfilled ?? 0
  const total = req.unitsRequired ?? 1
  const pct = Math.round((fulfilled / total) * 100)

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-slate-900 flex-1">Request Detail</h1>
          {!isTerminal && (
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setCancelOpen(true)}
            >
              Cancel request
            </Button>
          )}
        </div>

        {/* Status bar */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              <RequestStatusBadge status={req.status} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                {fulfilled}/{total} units
              </span>
            </div>
            {req.requiredBy && (
              <p className="mt-2 text-xs text-slate-500">
                Required by {format(new Date(req.requiredBy), 'dd MMM yyyy, h:mm a')}
              </p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="donors">Donors ({pledges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoCard title="Patient">
                  <Row label="Name" value={req.patient?.name} />
                  <Row label="Age" value={req.patient?.age} />
                  <Row label="Gender" value={req.patient?.gender} />
                </InfoCard>

                {req.patientContact && (
                  <InfoCard title="Contact Person">
                    <Row label="Name" value={req.patientContact.name} />
                    <Row label="Relation" value={req.patientContact.relationship} />
                    <Row label="Phone" value={req.patientContact.phone} />
                  </InfoCard>
                )}
              </div>

              <InfoCard title="Hospital">
                <Row label="Name" value={req.hospital?.name} />
                <Row label="Address" value={req.hospital?.address} />
                <Row label="Pincode" value={req.hospital?.pincode} />
              </InfoCard>

              {req.proofUrl && (
                <InfoCard title="Proof Document">
                  <a
                    href={req.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View uploaded document
                  </a>
                </InfoCard>
              )}

              {req.notes && (
                <InfoCard title="Notes">
                  <p className="text-sm text-slate-700">{req.notes}</p>
                </InfoCard>
              )}
            </div>
          </TabsContent>

          <TabsContent value="donors">
            {pledges.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No donors have pledged yet.</p>
            ) : (
              <div className="space-y-3">
                {pledges.map((pledge) => (
                  <DonorPledgeCard key={pledge._id} pledge={pledge} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel request"
        description="Please provide a reason for cancelling this blood request."
        reasonLabel="Reason"
        reasonPlaceholder="Why are you cancelling?"
        submitLabel="Cancel request"
        loading={isPending}
        onSubmit={({ reason }) => doCancel({ reason })}
      />
    </AppShell>
  )
}

function InfoCard({ title, children }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <dl className="divide-y divide-slate-100 text-sm">{children}</dl>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 font-medium text-right">{value ?? '—'}</dd>
    </div>
  )
}

function DonorPledgeCard({ pledge }) {
  const isActive = pledge.status === 'ACCEPTED' || pledge.status === 'FULFILLED'
  const isInactive = ['CANCELLED', 'NO_SHOW', 'VOID'].includes(pledge.status)

  return (
    <Card className={isInactive ? 'opacity-60' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-slate-800">{pledge.donor?.name ?? 'Donor'}</p>
              <PledgeStatusBadge status={pledge.status} />
            </div>
            {isActive && (pledge.donor?.phone || pledge.donor?.email) && (
              <TooltipProvider>
                <div className="flex flex-col gap-0.5">
                  {pledge.donor?.phone && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`tel:${pledge.donor.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          <Phone className="h-3 w-3" />
                          {pledge.donor.phone}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        Visible because you have an active pledge
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {pledge.donor?.email && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`mailto:${pledge.donor.email}`}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          <Mail className="h-3 w-3" />
                          {pledge.donor.email}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        Visible because you have an active pledge
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDistanceToNow(new Date(pledge.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
