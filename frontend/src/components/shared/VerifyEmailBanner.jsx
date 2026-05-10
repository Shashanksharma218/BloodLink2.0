import { useState } from 'react'
import { Mail, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { resendVerification } from '@/services/endpoints/auth'

export function VerifyEmailBanner() {
  const { account } = useAuth()
  const [sending, setSending] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!account || account.emailVerified || dismissed) return null

  const handleResend = async () => {
    setSending(true)
    try {
      await resendVerification()
      toast.success('Verification email sent. Check your inbox.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2.5">
        <Mail className="h-4 w-4 flex-shrink-0 text-amber-700" />
        <p className="flex-1 text-sm text-amber-900">
          Please verify your email address ({account.email}) to pledge donations and receive certificates.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
        >
          {sending && <Loader2 className="h-3 w-3 animate-spin" />}
          Resend
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-900"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
