import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center px-6">
      <p className="text-7xl font-bold text-slate-200">404</p>
      <h1 className="text-xl font-semibold text-slate-800">Page not found</h1>
      <p className="text-sm text-slate-500 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild size="sm" className="mt-2">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}
