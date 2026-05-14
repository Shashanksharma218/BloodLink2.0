import { useQuery } from '@tanstack/react-query'
import { getDonations, getPledges, getCertificates } from '@/services/endpoints/donor'
import { getHospitalDonations, getHospitalRequests } from '@/services/endpoints/hospital'
import { getMyRequests } from '@/services/endpoints/seeker'
import { HeartPulse, Activity, Award, ClipboardList, CheckSquare } from 'lucide-react'

export function useDonorActivityFeed() {
  const { data: donations } = useQuery({
    queryKey: ['donor', 'donations', { limit: 10 }],
    queryFn: () => getDonations({ limit: 10 }),
    staleTime: 60_000,
  })
  const { data: pledges } = useQuery({
    queryKey: ['donor', 'pledges', { limit: 10 }],
    queryFn: () => getPledges({ limit: 10 }),
    staleTime: 30_000,
  })
  const { data: certs } = useQuery({
    queryKey: ['donor', 'certificates', { limit: 5 }],
    queryFn: () => getCertificates({ limit: 5 }),
    staleTime: 60_000,
  })

  const donationItems = (donations?.donations ?? donations ?? []).map((d) => ({
    id: `don-${d._id}`,
    icon: Activity,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    title: `Donated ${d.type?.replace('_', ' ').toLowerCase() ?? 'blood'}`,
    description: d.hospital?.name,
    time: d.createdAt,
  }))

  const pledgeItems = (pledges?.pledges ?? pledges ?? []).map((p) => ({
    id: `ple-${p._id}`,
    icon: HeartPulse,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: `Pledge ${p.status?.toLowerCase() ?? 'accepted'}`,
    description: p.request?.bloodGroup ? `${p.request.bloodGroup} — ${p.request.hospital?.name ?? ''}` : undefined,
    time: p.updatedAt ?? p.createdAt,
  }))

  const certItems = (certs?.certificates ?? certs ?? []).map((c) => ({
    id: `cert-${c._id}`,
    icon: Award,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Certificate earned',
    description: c.donation?.hospital?.name,
    time: c.createdAt,
  }))

  return [...donationItems, ...pledgeItems, ...certItems]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
}

export function useHospitalActivityFeed() {
  const { data: donations } = useQuery({
    queryKey: ['hospital', 'donations', { limit: 10 }],
    queryFn: () => getHospitalDonations({ limit: 10 }),
    staleTime: 30_000,
  })
  const { data: requests } = useQuery({
    queryKey: ['hospital', 'requests', { limit: 5 }],
    queryFn: () => getHospitalRequests({ limit: 5 }),
    staleTime: 30_000,
  })

  const donItems = (donations?.donations ?? []).map((d) => ({
    id: `don-${d._id}`,
    icon: Activity,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: `Donation ${d.state?.toLowerCase() ?? 'recorded'}`,
    description: d.donor?.name ?? 'Walk-in donor',
    time: d.updatedAt ?? d.createdAt,
  }))

  const reqItems = (requests?.requests ?? []).map((r) => ({
    id: `req-${r._id}`,
    icon: ClipboardList,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    title: `Request ${r.status?.replace('_', ' ').toLowerCase() ?? 'updated'}`,
    description: `${r.bloodGroup} · ${r.unitsRequired} units`,
    time: r.updatedAt ?? r.createdAt,
  }))

  return [...donItems, ...reqItems]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)
}

export function useSeekerActivityFeed() {
  const { data } = useQuery({
    queryKey: ['seeker', 'requests', { limit: 20 }],
    queryFn: () => getMyRequests({ limit: 20 }),
    staleTime: 30_000,
  })

  const all = data?.requests ?? data ?? []

  return all.map((r) => ({
    id: `req-${r._id}`,
    icon: CheckSquare,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: `Request ${r.status?.replace(/_/g, ' ').toLowerCase() ?? 'created'}`,
    description: `${r.bloodGroup} · ${r.hospital?.name ?? ''}`,
    time: r.updatedAt ?? r.createdAt,
  })).slice(0, 8)
}
