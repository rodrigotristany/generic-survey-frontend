import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getAccessToken, logout as doLogout } from '@/lib/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (tokens: { access_token: string; refresh_token: string }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAccessToken())

  const login = (tokens: { access_token: string; refresh_token: string }) => {
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    setIsAuthenticated(true)
  }

  const logout = async () => {
    await doLogout()
    setIsAuthenticated(false)
  }

  useEffect(() => {
    const handleStorage = () => setIsAuthenticated(!!getAccessToken())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
