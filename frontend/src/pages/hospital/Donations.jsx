import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { PlusCircle, CheckCircle, XCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DonationStateBadge } from '@/components/shared/DonationStateBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState, TableSkeleton } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { getHospitalDonations, verifyDonation, rejectDonation } from '@/services/endpoints/hospital'

export default function HospitalDonations() {
  const qc = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState(null)

  const pending = useQuery({
    queryKey: ['hospital', 'donations', { state: 'RECORDED' }],
    queryFn: () => getHospitalDonations({ state: 'RECORDED', limit: 50 }),
    staleTime: 0,
  })
  const verified = useQuery({
    queryKey: ['hospital', 'donations', { state: 'VERIFIED' }],
    queryFn: () => getHospitalDonations({ state: 'VERIFIED', limit: 50 }),
  })

  const { mutate: doVerify } = useMutation({
    mutationFn: verifyDonation,
    onSuccess: () => {
      toast.success('Donation verified. Certificate issued.')
      qc.invalidateQueries({ queryKey: ['hospital', 'donations'] })
    },
    onError: (err) => toast.error(err.message),
  })

  const { mutate: doReject, isPending: rejecting } = useMutation({
    mutationFn: ({ id, body }) => rejectDonation(id, body),
    onSuccess: () => {
      toast.success('Donation rejected.')
      setRejectTarget(null)
      qc.invalidateQueries({ queryKey: ['hospital', 'donations'] })
    },
    onError: (err) => toast.error(err.message),
  })

  const pendingList = pending.data?.donations ?? pending.data ?? []
  const verifiedList = verified.data?.donations ?? verified.data ?? []

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Donations</h1>
          <Button asChild size="sm">
            <Link to="/hospital/donations/new">
              <PlusCircle className="h-4 w-4" />
              Record Donation
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending Verify ({pendingList.length})</TabsTrigger>
            <TabsTrigger value="verified">Verified</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.isLoading && <TableSkeleton />}
            {pending.isError && <ErrorState message={pending.error.message} onRetry={pending.refetch} />}
            {!pending.isLoading && !pending.isError && pendingList.length === 0 && (
              <EmptyState icon={CheckCircle} title="No pending donations" description="All recorded donations have been reviewed." />
            )}
            {!pending.isLoading && !pending.isError && pendingList.length > 0 && (
              <DonationTable
                donations={pendingList}
                showActions
                onVerify={(id) => doVerify(id)}
                onReject={(id) => setRejectTarget(id)}
              />
            )}
          </TabsContent>

          <TabsContent value="verified">
            {verified.isLoading && <TableSkeleton />}
            {!verified.isLoading && verifiedList.length === 0 && (
              <EmptyState title="No verified donations yet" />
            )}
            {!verified.isLoading && verifiedList.length > 0 && (
              <DonationTable donations={verifiedList} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ReasonDialog
        open={!!rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        title="Reject donation"
        description="Provide a reason for rejecting this donation record."
        reasonLabel="Reason"
        submitLabel="Reject"
        loading={rejecting}
        onSubmit={({ reason }) => doReject({ id: rejectTarget, body: { reason } })}
      />
    </AppShell>
  )
}

function DonationTable({ donations, showActions, onVerify, onReject }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Donor</TableHead>
            <TableHead>Blood</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Units</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>State</TableHead>
            {showActions && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {donations.map((d) => (
            <TableRow key={d._id}>
              <TableCell>
                <div>
                  <p className="font-medium">{d.donor?.name ?? '—'}</p>
                  {d.donor?.phone && <p className="text-xs text-slate-400">{d.donor.phone}</p>}
                </div>
              </TableCell>
              <TableCell><BloodGroupBadge group={d.donor?.bloodGroup} /></TableCell>
              <TableCell>{d.donationType?.replace('_', ' ')}</TableCell>
              <TableCell>{d.units}</TableCell>
              <TableCell>{d.donatedAt ? format(new Date(d.donatedAt), 'dd MMM yyyy') : '—'}</TableCell>
              <TableCell><DonationStateBadge state={d.state} /></TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => onVerify(d._id)}>
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline"
                      className="border-red-200 text-red-600"
                      onClick={() => onReject(d._id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
