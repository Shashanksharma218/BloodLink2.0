import { motion } from 'framer-motion'
import { HeartPulse, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Hero({ onBecomeDonor, onRequestBlood }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white" />
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
        >
          <HeartPulse className="h-3.5 w-3.5" />
          Every drop counts
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl"
        >
          Donate Blood. <span className="text-brand-600">Save Lives.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 max-w-xl text-balance text-base text-slate-600 sm:text-lg"
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
      </div>
    </section>
  )
}
