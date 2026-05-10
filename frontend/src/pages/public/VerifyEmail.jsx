import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { verifyEmail } from '@/services/endpoints/auth'
import { useAuth } from '@/context/AuthContext'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const role = params.get('role')
  const [state, setState] = useState('loading') // loading | ok | error
  const [errorMsg, setErrorMsg] = useState('')
  const { refresh, account } = useAuth()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function run() {
      if (!token || !role) {
        setErrorMsg('Missing verification token.')
        setState('error')
        return
      }
      try {
        await verifyEmail({ token, role })
        if (account) await refresh()
        setState('ok')
      } catch (err) {
        setErrorMsg(err.message || 'Verification failed')
        setState('error')
      }
    }

    run()
  }, [token, role])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <img src="/blood-drop.png" alt="BloodLink" className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold text-slate-900">BloodLink</span>
      </Link>

      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          {state === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-brand-600 animate-spin mx-auto" />
              <h1 className="text-xl font-bold text-slate-900">Verifying your email...</h1>
            </>
          )}

          {state === 'ok' && (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-bold text-slate-900">Email verified</h1>
              <p className="text-sm text-slate-500">
                Your BloodLink account is fully activated. You can now pledge donations and receive certificates.
              </p>
              <Button asChild className="w-full">
                <Link to={account ? '/dashboard' : '/'}>
                  {account ? 'Go to dashboard' : 'Back home'}
                </Link>
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <XCircle className="h-14 w-14 text-red-500 mx-auto" />
              <h1 className="text-xl font-bold text-slate-900">Verification failed</h1>
              <p className="text-sm text-slate-500">{errorMsg}</p>
              <p className="text-xs text-slate-400">
                The link may have expired. You can request a new verification email from your account.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">Back home</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
