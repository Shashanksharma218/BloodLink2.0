import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Award, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Pagination } from '@/components/ui/pagination'
import { getCertificates } from '@/services/endpoints/donor'
import { downloadCertificate } from '@/services/endpoints/certificate'

export default function DonorCertificates() {
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['donor', 'certificates', { page }],
    queryFn: () => getCertificates({ page, limit: 12 }),
  })

  const certs = data?.certificates ?? data ?? []
  const meta = data?.meta ?? {}

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
        <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && certs.length === 0 && (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Your donation certificates will appear here after your donations are verified."
          />
        )}

        {!isLoading && !isError && certs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((cert) => (
              <CertCard
                key={cert._id}
                cert={cert}
                onDownload={() => handleDownload(cert)}
                loading={downloading === cert._id}
              />
            ))}
          </div>
        )}

        <Pagination page={page} total={meta.total ?? 0} limit={12} onPageChange={setPage} />
      </div>
    </AppShell>
  )
}

function CertCard({ cert, onDownload, loading }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500">#{cert.certificateNumber}</p>
            <p className="text-sm font-semibold text-slate-800">
              {cert.donationType?.replace('_', ' ') ?? 'Donation'}
            </p>
          </div>
        </div>

        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-400">Donated</dt>
            <dd className="text-slate-700">{cert.donatedAt ? format(new Date(cert.donatedAt), 'dd MMM yyyy') : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Hospital</dt>
            <dd className="text-slate-700 truncate max-w-[120px] text-right">{cert.hospital?.name ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Issued</dt>
            <dd className="text-slate-700">{cert.issuedAt ? format(new Date(cert.issuedAt), 'dd MMM yyyy') : '—'}</dd>
          </div>
        </dl>

        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={onDownload}
          disabled={loading}
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />
          }
          Download PDF
        </Button>
      </CardContent>
    </Card>
  )
}
