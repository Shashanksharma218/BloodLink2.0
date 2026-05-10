import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { account, loading, isDonor, isSeeker, isHospital } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!account) return <Navigate to="/" replace />

  if (requiredRole === 'donor' && !isDonor) return <Navigate to="/forbidden" replace />
  if (requiredRole === 'seeker' && !isSeeker) return <Navigate to="/forbidden" replace />
  if (requiredRole === 'hospital' && !isHospital) return <Navigate to="/forbidden" replace />

  return children
}
