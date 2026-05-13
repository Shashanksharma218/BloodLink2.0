import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import * as authEndpoints from '@/services/endpoints/auth'

const AuthContext = createContext(null)

const MODE_KEY = 'bloodlink:mode'

function deriveMode(pathname, manualMode) {
  if (pathname.startsWith('/seeker')) return 'seeker'
  if (pathname.startsWith('/donor')) return 'donor'
  return manualMode
}

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [manualMode, setManualMode] = useState(() => localStorage.getItem(MODE_KEY) || 'donor')
  const location = useLocation()

  const mode = deriveMode(location.pathname, manualMode)

  const refresh = useCallback(async () => {
    try {
      const data = await authEndpoints.me()
      setAccount(data.user)
    } catch {
      setAccount(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Listen for 401 broadcasts from the axios interceptor
  useEffect(() => {
    const handler = () => {
      setAccount(null)
      setLoading(false)
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = async (payload) => {
    const data = await authEndpoints.login(payload)
    setAccount(data.user)
    return data.user
  }

  const register = async (payload) => {
    const data = await authEndpoints.register(payload)
    setAccount(data.user)
    return data.user
  }

  const logout = async () => {
    try { await authEndpoints.logout() } catch { /* ignore */ }
    setAccount(null)
  }

  const setMode = (m) => {
    localStorage.setItem(MODE_KEY, m)
    setManualMode(m)
  }

  const isDonor = account?.role === 'user'
  const isSeeker = account?.role === 'user'
  const isHospital = account?.role === 'hospital'
  const isAdmin = account?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        account,
        loading,
        mode,
        setMode,
        isDonor,
        isSeeker,
        isHospital,
        isAdmin,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
