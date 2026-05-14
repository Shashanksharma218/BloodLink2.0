import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Award, Download, Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Pagination } from '@/components/ui/pagination'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { getCertificates, getPendingCertificates } from '@/services/endpoints/donor'
import { downloadCertificate } from '@/services/endpoints/certificate'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

export default function DonorCertificates() {
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['donor', 'certificates', { page }],
    queryFn: () => getCertificates({ page, limit: 12 }),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['donor', 'certificates', 'pending'],
    queryFn: getPendingCertificates,
    staleTime: 30_000,
  })

  const certs = data?.certificates ?? data ?? []
  const meta = data?.meta ?? {}
  const pendingDonations = pendingData?.pending ?? []

  const handleDownload = async (cert) => {
    if (!cert.pdfPath) {
      toast.info('Certificate PDF is still being generated. Try again in a moment.')
      return
    }
    setDownloading(cert._id)
    try {
      const blob = await downloadCertificate(cert._id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${cert.certificateNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      if (err.status === 422) {
        toast.info('Certificate PDF is still being generated. Try again shortly.')
      } else {
        toast.error(err.message)
      }
    } finally {
      setDownloading(null)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div {...MOTION_FADE_UP} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
            <Award className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
            <p className="text-sm text-slate-500">{(meta.total ?? 0) + pendingDonations.length} total</p>
          </div>
        </motion.div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && certs.length === 0 && pendingDonations.length === 0 && (
          <EmptyMascot
            title="No certificates yet"
            description="Your donation certificates will appear here after your donations are verified."
          />
        )}

        {!isLoading && !isError && (certs.length > 0 || pendingDonations.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((cert, i) => (
              <motion.div key={cert._id} {...MOTION_FADE_UP} {...staggerChild(i)}>
                <CertCard cert={cert} onDownload={() => handleDownload(cert)} loading={downloading === cert._id} />
              </motion.div>
            ))}
            {pendingDonations.map((don, i) => (
              <motion.div key={don._id} {...MOTION_FADE_UP} {...staggerChild(certs.length + i)}>
                <PendingCertCard donation={don} />
              </motion.div>
            ))}
          </div>
        )}

        <Pagination page={page} total={meta.total ?? 0} limit={12} onPageChange={setPage} />
      </div>
    </AppShell>
  )
}

function PendingCertCard({ donation }) {
  return (
    <div className="rounded-2xl border border-slate-200 border-dashed bg-slate-50 p-5 space-y-3 opacity-70">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Clock className="h-5 w-5 text-slate-400" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Generating…</p>
          <p className="text-sm font-semibold text-slate-600">
            {donation.donationType?.replace('_', ' ') ?? 'Donation'}
          </p>
        </div>
      </div>
      <dl className="space-y-1 text-xs">
        <Row label="Donated" value={donation.donatedAt ? format(new Date(donation.donatedAt), 'dd MMM yyyy') : '—'} />
        <Row label="Hospital" value={donation.hospital?.name ?? '—'} />
      </dl>
      <p className="text-xs text-slate-400 text-center">Certificate is being prepared</p>
    </div>
  )
}

function CertCard({ cert, onDownload, loading }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3"
    >
      {/* Decorative top stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-500 to-emerald-400" />

      <div className="flex items-center gap-3 pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
          <Award className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-slate-400">#{cert.certificateNumber}</p>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {cert.donationType?.replace('_', ' ') ?? 'Donation'}
          </p>
        </div>
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      </div>

      <dl className="space-y-1.5 text-xs">
        <Row label="Donated" value={cert.donatedAt ? format(new Date(cert.donatedAt), 'dd MMM yyyy') : '—'} />
        <Row label="Hospital" value={cert.hospital?.name ?? '—'} />
        <Row label="Issued" value={cert.issuedAt ? format(new Date(cert.issuedAt), 'dd MMM yyyy') : '—'} />
      </dl>

      <Button
        size="sm"
        variant="outline"
        className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        onClick={onDownload}
        disabled={loading}
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <Download className="h-3.5 w-3.5" />
        }
        Download PDF
      </Button>
    </motion.div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-400 shrink-0">{label}</dt>
      <dd className="text-slate-700 text-right truncate">{value ?? '—'}</dd>
    </div>
  )
}
