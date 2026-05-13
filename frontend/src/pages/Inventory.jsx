import { AppShell } from '@/components/layout/AppShell'
import { BloodStockSearch } from '@/components/inventory/BloodStockSearch'
import { ExternalLink } from 'lucide-react'

export default function Inventory() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blood Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live blood stock at registered blood centres across India, sourced from{' '}
            <a
              href="https://eraktkosh.mohfw.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-600 hover:underline"
            >
              eRaktKosh <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
        </div>
        <BloodStockSearch variant="full" />
      </div>
    </AppShell>
  )
}
