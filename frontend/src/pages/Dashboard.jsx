import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Droplet, LogOut } from 'lucide-react'
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
      <main className="mx-auto max-w-4xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              {isHospital ? (
                <Building2 className="h-5 w-5" />
              ) : (
                <Droplet className="h-5 w-5" fill="currentColor" />
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
      </main>
    </div>
  )
}

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
