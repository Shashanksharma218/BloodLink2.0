import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Droplet, ExternalLink } from 'lucide-react'
import { verifyCertificate } from '@/services/endpoints/certificate'
import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'

export default function VerifyCertificate() {
  const { verificationId } = useParams()

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['verify', verificationId],
    queryFn: () => verifyCertificate(verificationId),
    retry: false,
    staleTime: 0,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Verifying certificate...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Droplet className="h-4 w-4" fill="currentColor" />
        </span>
        <span className="text-lg font-bold text-slate-900">BloodLink</span>
      </Link>

      {isError || !cert ? (
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <XCircle className="h-14 w-14 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Certificate Not Found</h1>
            <p className="text-sm text-slate-500">
              We couldn't find a certificate with this verification ID. It may have been revoked or never issued.
            </p>
            <p className="text-xs text-slate-400 font-mono break-all">{verificationId}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <CardContent className="pt-10 pb-8 space-y-6">
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-bold text-slate-900">Certificate Verified</h1>
              <p className="text-sm text-slate-500">
                This blood donation certificate is authentic and was issued by BloodLink.
              </p>
            </div>

            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Donor" value={cert.donorName} />
              <Row label="Donation Type" value={cert.donationType?.replace('_', ' ')} />
              <Row label="Donation Date" value={fmt(cert.donatedAt)} />
              <Row label="Hospital" value={cert.hospitalName} />
              <Row label="Certificate #" value={cert.certificateNumber} className="font-mono text-xs" />
              <Row label="Issued" value={fmt(cert.issuedAt)} />
              <Row label="Verification ID" value={cert.verificationId} className="font-mono text-xs break-all" />
            </dl>

            <p className="text-center text-xs text-slate-400">
              This certificate is digitally verifiable on BloodLink.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function fmt(iso) {
  if (!iso) return '—'
  return format(new Date(iso), 'dd MMM yyyy')
}

function Row({ label, value, className }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-slate-500 flex-shrink-0">{label}</dt>
      <dd className={`text-slate-800 font-medium text-right ${className ?? ''}`}>{value || '—'}</dd>
    </div>
  )
}
