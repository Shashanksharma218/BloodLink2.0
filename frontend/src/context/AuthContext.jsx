import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, donorApi } from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await authApi.me()
      setUser(user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (payload) => {
    const { user } = await authApi.login(payload)
    setUser(user)
    return user
  }

  const register = async (payload) => {
    const { user } = await authApi.register(payload)
    setUser(user)
    return user
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  // Toggles donor availability preference and patches the user in context
  // without a full /me round-trip. The API response carries all derived fields.
  const updateAvailability = async (preference, reason) => {
    const data = await donorApi.setAvailability(preference, reason)
    setUser((prev) => ({
      ...prev,
      availabilityPreference: data.availabilityPreference,
      manualUnavailableReason: data.manualUnavailableReason,
      effectiveStatus: data.effectiveStatus,
      daysUntilAvailable: data.daysUntilAvailable,
      availableOn: data.availableOn,
    }))
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh, updateAvailability }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
