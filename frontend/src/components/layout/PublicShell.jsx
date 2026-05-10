import Navbar from '@/components/Navbar'

export function PublicShell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
