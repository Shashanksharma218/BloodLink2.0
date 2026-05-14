import { useQuery } from '@tanstack/react-query'
import { getDonorProfile } from '@/services/endpoints/donor'
import { getHospitalRequests, getHospitalDonations } from '@/services/endpoints/hospital'
import { getMyRequests } from '@/services/endpoints/seeker'
import { REQUEST_STATUS, DONATION_STATE } from '@/lib/enums'

export function useDonorMetrics() {
  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: getDonorProfile,
  })

  const livesImpacted = Math.max(0, (profile?.donationCount ?? 0) * 3)

  return {
    isLoading,
    error,
    refetch,
    donationCount: profile?.donationCount ?? 0,
    activePledgeCount: profile?.activePledgeCount ?? 0,
    certificateCount: profile?.certificateCount ?? 0,
    livesImpacted,
    status: profile?.effectiveStatus ?? 'INELIGIBLE',
    daysUntilAvailable: profile?.daysUntilAvailable ?? 0,
    bloodGroup: profile?.bloodGroup,
    name: profile?.name,
    profile,
  }
}

export function useHospitalMetrics() {
  const { data: queueData } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'PENDING_VERIFICATION', limit: 1 }],
    queryFn: () => getHospitalRequests({ status: 'PENDING_VERIFICATION', limit: 1 }),
    staleTime: 0,
  })
  const { data: activeData } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'VERIFIED', limit: 1 }],
    queryFn: () => getHospitalRequests({ status: 'VERIFIED', limit: 1 }),
    staleTime: 0,
  })
  const { data: donationsData } = useQuery({
    queryKey: ['hospital', 'donations', { limit: 50 }],
    queryFn: () => getHospitalDonations({ limit: 50 }),
    staleTime: 30_000,
  })

  const allDonations = donationsData?.donations ?? []
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonth = allDonations.filter((d) => new Date(d.createdAt) >= monthStart).length
  const lastMonth = allDonations.filter((d) => {
    const t = new Date(d.createdAt)
    return t >= lastMonthStart && t < monthStart
  }).length
  const monthDelta = lastMonth === 0 ? null : Math.round(((thisMonth - lastMonth) / lastMonth) * 100)

  const awaitingVerification = allDonations.filter((d) => d.state === DONATION_STATE.RECORDED).length

  return {
    pendingCount: queueData?.meta?.total ?? 0,
    activeCount: activeData?.meta?.total ?? 0,
    donationCount: donationsData?.meta?.total ?? 0,
    thisMonthDonations: thisMonth,
    monthDelta,
    awaitingVerification,
    allDonations,
  }
}

export function useSeekerMetrics() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['seeker', 'requests', { limit: 50 }],
    queryFn: () => getMyRequests({ limit: 50 }),
    staleTime: 0,
  })

  const all = data?.requests ?? data ?? []
  const active = all.filter((r) =>
    [REQUEST_STATUS.PENDING_VERIFICATION, REQUEST_STATUS.VERIFIED, REQUEST_STATUS.PARTIALLY_FULFILLED].includes(r.status)
  )
  const fulfilled = all.filter((r) => r.status === REQUEST_STATUS.FULFILLED)
  const pending = all.filter((r) => r.status === REQUEST_STATUS.PENDING_VERIFICATION)
  const totalPledges = all.reduce((sum, r) => sum + (r.pledgeCount ?? 0), 0)

  return {
    isLoading,
    error,
    refetch,
    allRequests: all,
    activeRequests: active,
    fulfilledCount: fulfilled.length,
    pendingCount: pending.length,
    totalPledges,
    totalCount: all.length,
  }
}
