import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { VerifyEmailBanner } from '@/components/shared/VerifyEmailBanner'

export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <VerifyEmailBanner />
      <div className="flex flex-1">
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <nav className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
          <Sidebar />
        </nav>

        <main className="flex-1 min-w-0 bg-slate-50">
          <div className="mx-auto max-w-5xl px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
