import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function DashboardRedirect() {
  const { isHospital, isDonor, isSeeker, mode } = useAuth()

  if (isHospital) return <Navigate to="/hospital" replace />
  if (isDonor && mode === 'donor') return <Navigate to="/donor" replace />
  if (isSeeker) return <Navigate to="/seeker" replace />
  if (isDonor) return <Navigate to="/donor" replace />

  return <Navigate to="/" replace />
}
