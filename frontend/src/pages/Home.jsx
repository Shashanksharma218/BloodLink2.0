import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Zap, Heart, ShieldCheck, MapPin, Activity } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('signup')
  const { account } = useAuth()
  const navigate = useNavigate()

  const handleCta = (intent) => {
    if (account) {
      navigate('/dashboard')
      return
    }
    setMode(intent)
    setOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero
          onBecomeDonor={() => handleCta('signup')}
          onRequestBlood={() => handleCta('signup')}
        />

        {/* How it works */}
        <section className="border-t border-slate-100 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">How it works</h2>
            <p className="mb-12 text-center text-sm text-slate-500">
              Three simple steps — from sign-up to a life saved.
            </p>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <Step
                icon={<UserPlus className="h-6 w-6 text-brand-600" />}
                step="1"
                title="Sign up"
                description="Create a free account in under a minute. Tell us your blood group and pincode."
              />
              <Step
                icon={<Zap className="h-6 w-6 text-amber-500" />}
                step="2"
                title="Get matched"
                description="Our system surfaces urgent requests near you. Hospitals verify every request."
              />
              <Step
                icon={<Heart className="h-6 w-6 text-rose-500" />}
                step="3"
                title="Donate or Receive"
                description="Pledge to donate, show up at the hospital, and get your digital certificate instantly."
              />
            </div>
          </div>
        </section>

        {/* Why BloodLink */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">Why BloodLink</h2>
            <p className="mb-12 text-center text-sm text-slate-500">
              Built for speed, trust, and transparency.
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Feature
                icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
                bg="bg-emerald-50"
                title="Verified hospitals"
                description="Every hospital on BloodLink is manually reviewed, so donors and seekers can trust every request."
              />
              <Feature
                icon={<MapPin className="h-5 w-5 text-brand-600" />}
                bg="bg-brand-50"
                title="Location-aware matching"
                description="Donors see requests nearest to their pincode first — no irrelevant alerts from the other side of the city."
              />
              <Feature
                icon={<Activity className="h-5 w-5 text-amber-600" />}
                bg="bg-amber-50"
                title="Donor status tracking"
                description="Automatic 90-day recovery window after each donation keeps both donors and hospitals informed."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/blood-drop.png" alt="" className="h-5 w-5 object-contain" />
            <span className="text-sm font-semibold text-slate-700">BloodLink</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">Semester project — IIIT Una</span>
          </div>
          <nav className="flex items-center gap-5 text-xs text-slate-500">
            <Link to="/verify/:id" className="hover:text-brand-600 hover:underline">
              Verify Certificate
            </Link>
            <a
              href="https://github.com/Shashanksharma218/BloodLink2"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-600 hover:underline"
            >
              GitHub
            </a>
            <a href="mailto:agarwalrishabh852@gmail.com" className="hover:text-brand-600 hover:underline">
              Contact
            </a>
          </nav>
        </div>
      </footer>

      <AuthModal open={open} onOpenChange={setOpen} initialMode={mode} />
    </div>
  )
}

function Step({ icon, step, title, description }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        {icon}
      </div>
      <span className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Step {step}</span>
      <h3 className="mb-2 text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function Feature({ icon, bg, title, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
        {icon}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}
