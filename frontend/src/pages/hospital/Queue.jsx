import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { FileText, CheckCircle, XCircle, Maximize2, ExternalLink, X } from 'lucide-react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { TableSkeleton } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { getHospitalRequests, verifyRequest, rejectRequest } from '@/services/endpoints/hospital'
import { REQUEST_REJECT } from '@/lib/enums'

const REJECT_CATS = [
  { value: REQUEST_REJECT.INVALID_PROOF, label: 'Invalid proof document' },
  { value: REQUEST_REJECT.DUPLICATE, label: 'Duplicate request' },
  { value: REQUEST_REJECT.UNREACHABLE, label: 'Contact unreachable' },
  { value: REQUEST_REJECT.OTHER, label: 'Other' },
]

export default function HospitalQueue() {
  const qc = useQueryClient()
  const [detail, setDetail] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'PENDING_VERIFICATION' }],
    queryFn: () => getHospitalRequests({ status: 'PENDING_VERIFICATION', limit: 50 }),
    staleTime: 0,
  })

  // eslint-disable-next-line dot-notation
  const requests = data?.['requests'] ?? data ?? []

  const { mutate: doVerify, isPending: verifying } = useMutation({
    mutationFn: verifyRequest,
    onSuccess: () => {
      toast.success('Request verified.')
      setDetail(null)
      qc.invalidateQueries({ queryKey: ['hospital', 'requests'] })
    },
    onError: (err) => toast.error(err.message),
  })

  const { mutate: doReject, isPending: rejecting } = useMutation({
    mutationFn: ({ id, body }) => rejectRequest(id, body),
    onSuccess: () => {
      toast.success('Request rejected.')
      setRejectTarget(null)
      setDetail(null)
      qc.invalidateQueries({ queryKey: ['hospital', 'requests'] })
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Verification Queue</h1>

        {isLoading && <TableSkeleton />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyState
            icon={CheckCircle}
            title="Queue is clear"
            description="No blood requests are pending verification right now."
          />
        )}

        {!isLoading && !isError && requests.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blood</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow
                    key={req._id}
                    className="cursor-pointer"
                    onClick={() => setDetail(req)}
                  >
                    <TableCell><BloodGroupBadge group={req.bloodGroup} /></TableCell>
                    <TableCell><UrgencyBadge urgency={req.urgency} /></TableCell>
                    <TableCell>{req.patient?.name ?? '—'}</TableCell>
                    <TableCell>{req.unitsRequired}</TableCell>
                    <TableCell>{format(new Date(req.createdAt), 'dd MMM, h:mm a')}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(req) }}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        {detail && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Request</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <BloodGroupBadge group={detail.bloodGroup} />
                <UrgencyBadge urgency={detail.urgency} />
              </div>

              <dl className="divide-y divide-slate-100 text-sm">
                <Row label="Patient" value={detail.patient?.name} />
                <Row label="Age" value={detail.patient?.age} />
                <Row label="Gender" value={detail.patient?.gender} />
                <Row label="Units" value={detail.unitsRequired} />
                <Row label="Required by" value={detail.requiredBy ? format(new Date(detail.requiredBy), 'dd MMM yyyy, h:mm a') : '—'} />
                <Row label="Contact" value={detail.patientContact?.name ? `${detail.patientContact.name} (${detail.patientContact.relationship}) · ${detail.patientContact.phone}` : '—'} />
                {detail.notes && <Row label="Notes" value={detail.notes} />}
              </dl>

              {detail.proofDocument && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-1">Proof Document</p>
                  {detail.proofDocument.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div
                      className="relative cursor-zoom-in group inline-block"
                      onClick={() => setLightboxUrl(detail.proofDocument)}
                    >
                      <img src={detail.proofDocument} alt="proof" className="rounded-lg border border-slate-200 max-h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-all flex items-center justify-center">
                        <Maximize2 className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                      </div>
                    </div>
                  ) : detail.proofDocument.match(/\.pdf$/i) ? (
                    <a href={detail.proofDocument} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="bg-red-100 rounded-lg p-2 shrink-0">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700">PDF Document</p>
                        <p className="text-xs text-slate-400">Click to open</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 ml-auto shrink-0" />
                    </a>
                  ) : (
                    <a href={detail.proofDocument} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
                      <FileText className="h-4 w-4" /> Open document
                    </a>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => doVerify(detail._id)}
                  disabled={verifying || rejecting}
                >
                  <CheckCircle className="h-4 w-4" />
                  Verify
                </Button>
                <Button
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  variant="outline"
                  onClick={() => { setRejectTarget(detail._id); setDetail(null) }}
                  disabled={verifying || rejecting}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ReasonDialog
        open={!!rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        title="Reject request"
        description="Please specify why this request is being rejected."
        categories={REJECT_CATS}
        reasonLabel="Additional notes"
        submitLabel="Reject request"
        loading={rejecting}
        onSubmit={({ category, reason }) => doReject({ id: rejectTarget, body: { category, reason } })}
      />

      <DialogPrimitive.Root open={!!lightboxUrl} onOpenChange={(v) => !v && setLightboxUrl(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-100 bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content
            className="fixed inset-0 z-100 flex items-center justify-center p-4 focus:outline-none"
            aria-describedby={undefined}
          >
            <DialogPrimitive.Title className="sr-only">Proof document preview</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 rounded-full p-1.5 transition-colors focus:outline-none"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            {lightboxUrl && (
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute top-4 left-4 text-white/80 hover:text-white bg-black/30 rounded-full p-1.5 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            {lightboxUrl && (
              <img
                src={lightboxUrl}
                alt="proof document"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={() => setLightboxUrl(null)}
              />
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </AppShell>
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
