import { useQuery } from '@tanstack/react-query'
import { getDonations } from '@/services/endpoints/donor'
import { getHospitalDonations } from '@/services/endpoints/hospital'
import { format, subMonths, startOfMonth } from 'date-fns'

function buildMonthlyBuckets(items = [], months = 12) {
  const now = new Date()
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = subMonths(now, months - 1 - i)
    return { label: format(d, 'MMM'), month: startOfMonth(d).toISOString(), value: 0 }
  })

  for (const item of items) {
    const d = new Date(item.createdAt)
    const key = format(startOfMonth(d), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    const bucket = buckets.find((b) => b.month.slice(0, 7) === format(d, 'yyyy-MM'))
    if (bucket) bucket.value++
  }

  return buckets
}

export function useDonorDonationTrend() {
  const { data } = useQuery({
    queryKey: ['donor', 'donations', { limit: 100 }],
    queryFn: () => getDonations({ limit: 100 }),
    staleTime: 60_000,
  })
  const items = data?.donations ?? data ?? []
  return buildMonthlyBuckets(items, 12)
}

export function useHospitalDonationTrend() {
  const { data } = useQuery({
    queryKey: ['hospital', 'donations', { limit: 100 }],
    queryFn: () => getHospitalDonations({ limit: 100 }),
    staleTime: 60_000,
  })
  const items = data?.donations ?? []
  return buildMonthlyBuckets(items, 6)
}
