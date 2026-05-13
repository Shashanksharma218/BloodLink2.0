import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { HeartPulse, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Mascot from './Mascot'
import FloatingDecor from './FloatingDecor'

const STATS = [
  { end: 500, suffix: '+', label: 'Lives saved' },
  { end: 200, suffix: '+', label: 'Active donors' },
  { label: '24/7', static: true, note: 'Emergency' },
]

function CountUp({ end, suffix = '' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let frame = 0
    const totalFrames = 60
    const timer = setInterval(() => {
      frame++
      setCount(Math.floor((frame / totalFrames) * end))
      if (frame >= totalFrames) clearInterval(timer)
    }, 20)
    return () => clearInterval(timer)
  }, [isInView, end])

  return <span ref={ref}>{count}{suffix}</span>
}

export default function HeroV2({ onBecomeDonor, onRequestBlood }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      {/* large blob top-right */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-200 opacity-30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 sm:py-28 md:grid-cols-2 md:items-center md:gap-8">
        {/* Left column */}
        <div className="flex flex-col items-start">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <HeartPulse className="h-3.5 w-3.5 text-brand-600" />
            </motion.span>
            Every drop counts
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
          >
            Donate Blood.{' '}
            <span className="text-brand-600">Save Lives.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 max-w-lg text-balance text-base text-slate-600 sm:text-lg"
          >
            BloodLink connects donors and hospitals so the right blood reaches the
            right person — fast, verified, and right around the corner.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={onBecomeDonor}>
              <HeartPulse className="h-4 w-4" />
              Become a Donor
            </Button>
            <Button size="lg" variant="outline" onClick={onRequestBlood}>
              <Search className="h-4 w-4" />
              Request Blood
            </Button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-6"
          >
            {STATS.map((s, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl font-bold text-brand-600">
                  {s.static ? s.label : <CountUp end={s.end} suffix={s.suffix} />}
                </span>
                <span className="text-xs text-slate-500">{s.note ?? s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right column — mascot + decoratives */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative flex items-center justify-center"
        >
          {/* soft radial backdrop */}
          <div
            className="absolute inset-0 rounded-full bg-brand-50 opacity-60 blur-2xl"
            aria-hidden="true"
          />
          <FloatingDecor />
          <Mascot className="relative h-56 w-auto sm:h-72 lg:h-80" />
        </motion.div>
      </div>
    </section>
  )
}
