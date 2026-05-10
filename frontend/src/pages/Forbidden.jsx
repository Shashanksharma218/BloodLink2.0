import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-7xl font-bold text-slate-200">403</p>
      <h1 className="text-xl font-semibold text-slate-800">Access denied</h1>
      <p className="text-sm text-slate-500 max-w-xs">
        You don't have permission to view this page.
      </p>
      <Button asChild size="sm" variant="outline" className="mt-2">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  )
}
