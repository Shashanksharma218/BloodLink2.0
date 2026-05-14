import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { PlusCircle, CheckCircle, XCircle, Activity } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DonationStateBadge } from '@/components/shared/DonationStateBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { TableSkeleton } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { ReasonDialog } from '@/components/shared/ReasonDialog'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { useCelebration } from '@/components/dashboard/CelebrationOverlay'
import { getHospitalDonations, verifyDonation, rejectDonation } from '@/services/endpoints/hospital'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

export default function HospitalDonations() {
  const qc = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState(null)
  const { celebrate } = useCelebration()

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
      celebrate('Donation Verified! 🎉')
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
        <motion.div {...MOTION_FADE_UP} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Donations</h1>
              <p className="text-sm text-slate-500">{pendingList.length} awaiting verification</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/hospital/donations/new">
              <PlusCircle className="h-4 w-4" />
              Record Donation
            </Link>
          </Button>
        </motion.div>

        <Tabs defaultValue="pending">
          <TabsList className="rounded-xl bg-slate-100">
            <TabsTrigger value="pending" className="rounded-lg">
              Pending Verify ({pendingList.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="rounded-lg">Verified</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.isLoading && <TableSkeleton />}
            {pending.isError && <ErrorState message={pending.error.message} onRetry={pending.refetch} />}
            {!pending.isLoading && !pending.isError && pendingList.length === 0 && (
              <EmptyMascot title="No pending donations" description="All recorded donations have been reviewed." />
            )}
            {!pending.isLoading && !pending.isError && pendingList.length > 0 && (
              <DonationTable donations={pendingList} showActions onVerify={doVerify} onReject={setRejectTarget} />
            )}
          </TabsContent>

          <TabsContent value="verified" className="mt-4">
            {verified.isLoading && <TableSkeleton />}
            {!verified.isLoading && verifiedList.length === 0 && (
              <EmptyMascot title="No verified donations yet" />
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
    <motion.div {...MOTION_FADE_UP} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
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
          {donations.map((d, i) => (
            <motion.tr
              key={d._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                    {d.donor?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{d.donor?.name ?? 'Walk-in'}</p>
                    {d.donor?.phone && <p className="text-xs text-slate-400">{d.donor.phone}</p>}
                  </div>
                </div>
              </TableCell>
              <TableCell><BloodGroupBadge group={d.donor?.bloodGroup} /></TableCell>
              <TableCell className="text-slate-600 text-sm">{d.donationType?.replace('_', ' ')}</TableCell>
              <TableCell className="text-slate-600">{d.units}</TableCell>
              <TableCell className="text-slate-500 text-xs">{d.donatedAt ? format(new Date(d.donatedAt), 'dd MMM yyyy') : '—'}</TableCell>
              <TableCell><DonationStateBadge state={d.state} /></TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 text-xs" onClick={() => onVerify(d._id)}>
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 h-7 text-xs"
                      onClick={() => onReject(d._id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  )
}
