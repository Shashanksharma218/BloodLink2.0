import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, LogOut, Loader2, CircleDot } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!user) return null
  const isHospital = user.role === 'hospital'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              {isHospital ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <img src="/blood-drop.png" alt="" className="h-7 w-7 object-contain" />
              )}
            </span>
            <div>
              <p className="text-sm text-slate-500">
                {isHospital ? 'Hospital account' : 'Donor account'}
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Welcome, {user.name}
              </h1>
            </div>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={user.email} />
            <Field label="Pincode" value={user.pincode} />
            {!isHospital && <Field label="Blood group" value={user.bloodGroup} />}
            {user.phone && <Field label="Phone" value={user.phone} />}
            {isHospital && user.address && (
              <Field label="Address" value={user.address} />
            )}
          </dl>

          <div className="mt-8 flex justify-end">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </motion.div>

        {!isHospital && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <DonorStatusCard />
          </motion.div>
        )}
      </main>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  AVAILABLE:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RECOVERING:  'bg-amber-50  text-amber-700  border border-amber-200',
  UNAVAILABLE: 'bg-slate-100 text-slate-600  border border-slate-200',
  INELIGIBLE:  'bg-red-50    text-red-700    border border-red-200',
}

const STATUS_LABELS = {
  AVAILABLE:   'Available',
  RECOVERING:  'Recovering',
  UNAVAILABLE: 'Unavailable',
  INELIGIBLE:  'Not enrolled',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.UNAVAILABLE}`}>
      <CircleDot className="h-3 w-3" />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ─── Donor status card ────────────────────────────────────────────────────────

function DonorStatusCard() {
  const { user, updateAvailability } = useAuth()
  const [showOptOut, setShowOptOut] = useState(false)
  const [reason, setReason] = useState('')
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')

  const status = user.effectiveStatus ?? 'AVAILABLE'
  const isUnavailable = user.availabilityPreference === 'UNAVAILABLE'
  const isIneligible = status === 'INELIGIBLE'
  const isRecovering = status === 'RECOVERING'

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

  const handleResume = async () => {
    setError('')
    setToggling(true)
    try {
      await updateAvailability('AVAILABLE')
    } catch {
      setError('Failed to update availability. Please try again.')
    } finally {
      setToggling(false)
    }
  }

  const handlePause = async () => {
    setError('')
    setToggling(true)
    try {
      await updateAvailability('UNAVAILABLE', reason || undefined)
      setShowOptOut(false)
      setReason('')
    } catch {
      setError('Failed to update availability. Please try again.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Donor status</h2>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={status} />
        {isRecovering && user.daysUntilAvailable > 0 && (
          <span className="text-sm text-slate-500">
            {user.daysUntilAvailable} day{user.daysUntilAvailable !== 1 ? 's' : ''} remaining
          </span>
        )}
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Last donation</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            {user.lastDonationDate ? fmt(user.lastDonationDate) : 'Never'}
          </dd>
        </div>
        {isRecovering && user.availableOn && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Available again</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{fmt(user.availableOn)}</dd>
          </div>
        )}
        {isUnavailable && user.manualUnavailableReason && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Reason</dt>
            <dd className="mt-0.5 text-slate-600">{user.manualUnavailableReason}</dd>
          </div>
        )}
      </dl>

      {isRecovering && !isUnavailable && (
        <p className="mt-4 text-xs text-slate-500">
          You're in the 56-day recovery window. You can still set your preference — it will take effect once recovery ends.
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {!isIneligible && (
        <div className="mt-6">
          {isUnavailable ? (
            <Button size="sm" onClick={handleResume} disabled={toggling}>
              {toggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Resume availability
            </Button>
          ) : (
            <>
              {!showOptOut && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowOptOut(true); setError('') }}
                >
                  Pause availability
                </Button>
              )}

              <AnimatePresence>
                {showOptOut && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Reason <span className="text-slate-400">(optional)</span>
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Travelling, medical, etc."
                          rows={2}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600/40 resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handlePause} disabled={toggling}>
                          {toggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Confirm pause
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setShowOptOut(false); setReason(''); setError('') }}
                          disabled={toggling}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Generic field ────────────────────────────────────────────────────────────

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}
