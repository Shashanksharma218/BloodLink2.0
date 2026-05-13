import { motion } from 'framer-motion'
import { HeartPulse, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CONFETTI = [
  { shape: 'drop',  x: '5%',  y: '15%', size: 18, delay: 0,   dur: 8 },
  { shape: 'plus',  x: '15%', y: '65%', size: 14, delay: 1.5, dur: 7 },
  { shape: 'spark', x: '85%', y: '20%', size: 16, delay: 0.8, dur: 9 },
  { shape: 'drop',  x: '92%', y: '60%', size: 20, delay: 2.1, dur: 7.5 },
  { shape: 'plus',  x: '50%', y: '5%',  size: 12, delay: 0.3, dur: 10 },
  { shape: 'spark', x: '70%', y: '80%', size: 14, delay: 1.2, dur: 8 },
  { shape: 'drop',  x: '35%', y: '75%', size: 16, delay: 2.5, dur: 6.5 },
]

function ConfettiShape({ shape, size }) {
  if (shape === 'drop') {
    return (
      <svg width={size} height={size * 1.2} viewBox="0 0 40 48" fill="none" aria-hidden="true">
        <path d="M20 2 C28 14, 36 24, 36 32 A16 16 0 0 1 4 32 C4 24, 12 14, 20 2Z" fill="white" fillOpacity="0.5" />
      </svg>
    )
  }
  if (shape === 'plus') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="10" y="2" width="4" height="20" rx="2" fill="white" fillOpacity="0.45" />
        <rect x="2" y="10" width="20" height="4" rx="2" fill="white" fillOpacity="0.45" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L13.5 9H21L15 13.5L17 21L12 16.5L7 21L9 13.5L3 9H10.5L12 2Z" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default function FinalCta({ onBecomeDonor, onRequestBlood }) {
  return (
    <section className="relative overflow-hidden bg-linear-to-r from-brand-600 to-brand-700 py-24">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: c.x, top: c.y }}
            animate={{ y: [0, -20, 0], rotate: [0, 15, -15, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ConfettiShape shape={c.shape} size={c.size} />
          </motion.div>
        ))}
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-white sm:text-4xl"
        >
          Ready to make a difference?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-base text-brand-100 sm:text-lg"
        >
          You can't scroll anymore. Your next donation could save 3 lives.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            onClick={onBecomeDonor}
            className="bg-white text-brand-700 hover:bg-brand-50 border-0"
          >
            <HeartPulse className="h-4 w-4" />
            Become a Donor
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onRequestBlood}
            className="border-white/60 bg-transparent text-white hover:bg-white/15"
          >
            <Search className="h-4 w-4" />
            Request Blood
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
