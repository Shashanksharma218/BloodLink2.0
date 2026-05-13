import { Link } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import { BloodStockSearch } from '@/components/inventory/BloodStockSearch'
import { ExternalLink } from 'lucide-react'

export default function BloodStock() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl w-full px-6 py-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blood Stock Search</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live blood availability at registered blood centres across India, sourced from{' '}
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
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/blood-drop.png" alt="" className="h-5 w-5 object-contain" />
            <span className="text-sm font-semibold text-slate-700">BloodLink</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400">Semester project — IIIT Una</span>
          </div>
          <nav className="flex items-center gap-5 text-xs text-slate-500">
            <Link to="/" className="hover:text-brand-600 hover:underline">Home</Link>
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
    </div>
  )
}
