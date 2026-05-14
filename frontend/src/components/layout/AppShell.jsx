import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { VerifyEmailBanner } from '@/components/shared/VerifyEmailBanner'

export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <VerifyEmailBanner />
      <div className="flex flex-1">
        {/* Sidebar — hidden on mobile/tablet, visible on lg+ */}
        <nav className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
          <Sidebar />
        </nav>

        <main className="relative flex-1 min-w-0 bg-linear-to-br from-slate-50 via-white to-brand-50/30">
          {/* Decorative blob */}
          <div
            className="pointer-events-none fixed right-0 top-0 h-96 w-96 rounded-full bg-brand-100 opacity-20 blur-3xl z-0"
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
