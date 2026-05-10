import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ClipboardList, CheckSquare, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getHospitalRequests, getHospitalDonations } from '@/services/endpoints/hospital'
import { useAuth } from '@/context/AuthContext'

export default function HospitalHome() {
  const { account } = useAuth()

  const { data: queueData } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'PENDING_VERIFICATION' }],
    queryFn: () => getHospitalRequests({ status: 'PENDING_VERIFICATION', limit: 1 }),
    staleTime: 0,
  })

  const { data: activeData } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'VERIFIED' }],
    queryFn: () => getHospitalRequests({ status: 'VERIFIED', limit: 1 }),
    staleTime: 0,
  })

  const { data: donationsData } = useQuery({
    queryKey: ['hospital', 'donations', {}],
    queryFn: () => getHospitalDonations({ limit: 1 }),
    staleTime: 0,
  })

  const pendingCount = queueData?.meta?.total ?? 0
  const activeCount = activeData?.meta?.total ?? 0
  const donationCount = donationsData?.meta?.total ?? 0
  const pendingVerifyCount = donationsData?.donations?.filter?.(d => d.state === 'RECORDED')?.length ?? 0

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {account?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Hospital dashboard overview</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link to="/hospital/queue">
            <StatCard
              icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
              label="Pending Verification"
              value={pendingCount}
              bg="bg-amber-50"
            />
          </Link>
          <Link to="/hospital/active">
            <StatCard
              icon={<CheckSquare className="h-5 w-5 text-brand-500" />}
              label="Active Requests"
              value={activeCount}
              bg="bg-brand-50"
            />
          </Link>
          <Link to="/hospital/donations">
            <StatCard
              icon={<img src="/blood-drop.png" alt="" className="h-5 w-5 object-contain" />}
              label="Total Donations"
              value={donationCount}
              bg="bg-emerald-50"
            />
          </Link>
          <Link to="/hospital/donations">
            <StatCard
              icon={<Clock className="h-5 w-5 text-slate-500" />}
              label="Awaiting Verify"
              value={pendingVerifyCount}
              bg="bg-slate-100"
            />
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ icon, label, value, bg }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-5 pb-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${bg} mb-3`}>
          {icon}
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
