import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { BloodStockSearch } from '@/components/inventory/BloodStockSearch'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { ExternalLink, Droplets } from 'lucide-react'
import { MOTION_FADE_UP } from '@/components/dashboard/theme'

export default function Inventory() {
  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div {...MOTION_FADE_UP} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <Droplets className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blood Inventory</h1>
            <p className="text-sm text-slate-500">
              Live stock via{' '}
              <a
                href="https://eraktkosh.mohfw.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline"
              >
                eRaktKosh <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </motion.div>

        <SectionCard title="Search blood stock" accentColor="#be123c">
          <BloodStockSearch variant="full" />
        </SectionCard>
      </div>
    </AppShell>
  )
}
