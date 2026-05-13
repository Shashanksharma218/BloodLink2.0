import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, MapPin, Activity } from 'lucide-react'
import Navbar from '@/components/Navbar'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'
import HeroV2 from '@/components/home/HeroV2'
import Marquee from '@/components/home/Marquee'
import CompatibilityTool from '@/components/home/CompatibilityTool'
import EligibilityChecklist from '@/components/home/EligibilityChecklist'
import FinalCta from '@/components/home/FinalCta'
import { BloodStockSearch } from '@/components/inventory/BloodStockSearch'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55 },
}

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
        {/* 1. Hero */}
        <HeroV2
          onBecomeDonor={() => handleCta('signup')}
          onRequestBlood={() => handleCta('signup')}
        />

        {/* 2. Marquee */}
        <Marquee />

        {/* 3. Live Blood Stock */}
        <section id="blood-stock" className="relative overflow-hidden bg-slate-50 py-20">
          {/* decorative blobs */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-100 opacity-40 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-brand-200 opacity-30 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp}>
              <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
                Find blood stock near you
              </h2>
              <p className="mb-10 text-center text-sm text-slate-500">
                Live availability from blood centres across India via eRaktKosh.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <BloodStockSearch variant="compact" />
            </motion.div>
          </div>
        </section>

        {/* 4. How it works */}
        <section className="border-t border-slate-100 bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp}>
              <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">How it works</h2>
              <p className="mb-12 text-center text-sm text-slate-500">
                Three simple steps — from sign-up to a life saved.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Sign up',
                  description: 'Create a free account in under a minute. Tell us your blood group and pincode.',
                  icon: <RegisterIllustration />,
                },
                {
                  step: '2',
                  title: 'Get matched',
                  description: 'Our system surfaces urgent requests near you. Hospitals verify every request.',
                  icon: <NotificationIllustration />,
                },
                {
                  step: '3',
                  title: 'Donate or Receive',
                  description: 'Pledge to donate, show up at the hospital, and get your digital certificate instantly.',
                  icon: <HandIllustration />,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  whileHover={{ y: -4 }}
                  className="relative flex flex-col items-center text-center rounded-2xl border border-slate-100 bg-slate-50 p-6"
                >
                  <span className="absolute right-4 top-4 text-xs font-bold text-slate-300">
                    {item.step}
                  </span>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Compatibility tool */}
        <CompatibilityTool />

        {/* 6. Eligibility checklist */}
        <EligibilityChecklist />

        {/* 7. Why BloodLink */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp}>
              <h2 className="mb-3 text-center text-2xl font-bold text-slate-900">Why BloodLink</h2>
              <p className="mb-12 text-center text-sm text-slate-500">
                Built for speed, trust, and transparency.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
                  bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
                  title: 'Verified hospitals',
                  description: 'Every hospital on BloodLink is manually reviewed, so donors and seekers can trust every request.',
                },
                {
                  icon: <MapPin className="h-5 w-5 text-brand-600" />,
                  bg: 'bg-gradient-to-br from-brand-50 to-brand-100',
                  title: 'Location-aware matching',
                  description: 'Donors see requests nearest to their pincode first — no irrelevant alerts from the other side of the city.',
                },
                {
                  icon: <Activity className="h-5 w-5 text-amber-600" />,
                  bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
                  title: 'Donor status tracking',
                  description: 'Automatic 90-day recovery window after each donation keeps both donors and hospitals informed.',
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${f.bg}`}>
                    {f.icon}
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-slate-800">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Final CTA */}
        <FinalCta
          onBecomeDonor={() => handleCta('signup')}
          onRequestBlood={() => handleCta('signup')}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img src="/blood-drop.png" alt="" className="h-6 w-6 object-contain" />
                <span className="text-sm font-bold text-slate-800">BloodLink</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connecting donors, seekers, and hospitals.<br />
                Semester project — IIIT Una.
              </p>
            </div>

            {/* Links */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick links</p>
              <nav className="flex flex-col gap-1.5 text-xs text-slate-500">
                <Link to="/blood-stock" className="hover:text-brand-600 hover:underline">Find Blood Stock</Link>
                <Link to="/verify/:id" className="hover:text-brand-600 hover:underline">Verify Certificate</Link>
                <a href="https://github.com/Shashanksharma218/BloodLink2" target="_blank" rel="noreferrer" className="hover:text-brand-600 hover:underline">GitHub</a>
              </nav>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
              <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                <span>IIIT Una, Himachal Pradesh</span>
                <a href="mailto:bloodlink.iiitu@gmail.com" className="hover:text-brand-600 hover:underline">
                  bloodlink.iiitu@gmail.com
                </a>
                <span className="text-brand-600 font-medium">24/7 Emergency Support</span>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            © 2025 BloodLink. Built with care for every drop that matters.
          </div>
        </div>
      </footer>

      <AuthModal open={open} onOpenChange={setOpen} initialMode={mode} />
    </div>
  )
}

/* ── inline SVG illustrations for "How it works" ── */

function RegisterIllustration() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
      {/* person */}
      <circle cx="24" cy="14" r="6" fill="#fecdd3" />
      <path d="M14 38 C14 30 34 30 34 38" fill="#fda4af" />
      {/* clipboard */}
      <rect x="28" y="22" width="14" height="18" rx="2" fill="white" stroke="#be123c" strokeWidth="1.5" />
      <rect x="31" y="20" width="8" height="4" rx="1" fill="#be123c" />
      <line x1="31" y1="30" x2="39" y2="30" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="34" x2="37" y2="34" stroke="#be123c" strokeWidth="1.5" strokeLinecap="round" />
      {/* plus */}
      <circle cx="39" cy="23" r="5" fill="#be123c" />
      <line x1="39" y1="20.5" x2="39" y2="25.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="36.5" y1="23" x2="41.5" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function NotificationIllustration() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
      {/* phone body */}
      <rect x="13" y="6" width="22" height="36" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="17" y="12" width="14" height="20" rx="1" fill="white" />
      <circle cx="24" cy="38" r="2" fill="#cbd5e1" />
      {/* heart notification */}
      <path d="M24 17 C24 17 20 14 20 18 C20 21 24 24 24 24 C24 24 28 21 28 18 C28 14 24 17 24 17Z" fill="#be123c" />
      {/* bell */}
      <path d="M31 10 C31 10 33 8 35 10 C37 12 37 15 35 16 L31 18 Z" fill="#fbbf24" />
      <circle cx="31.5" cy="19" r="1.5" fill="#fbbf24" />
    </svg>
  )
}

function HandIllustration() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
      {/* hand */}
      <path d="M10 28 C10 28 10 38 20 40 L32 40 C38 40 40 34 40 30 L40 22 C40 20 38 18 36 20 L36 14 C36 12 34 10 32 12 L32 10 C32 8 30 6 28 8 L28 12 C26 10 24 12 24 14 L24 16 C22 14 18 14 18 18 L18 30 Z" fill="#fecdd3" stroke="#fda4af" strokeWidth="0.5" />
      {/* blood drop in palm */}
      <path d="M24 20 C26 23 28 26 28 28 A4 4 0 0 1 20 28 C20 26 22 23 24 20Z" fill="#be123c" />
    </svg>
  )
}
