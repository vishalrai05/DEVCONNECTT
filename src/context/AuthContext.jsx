/**
 * AuthContext — global authentication state
 *
 * Why Context API?
 * Login status (user) and auth actions (login/register/logout) are needed in
 * many places: Navbar, ProtectedRoute, Login/SignUp pages, Dashboard, etc.
 * Context avoids prop-drilling and keeps a single source of truth.
 *
 * Persistence strategy:
 * On mount we call GET /api/auth/me. If the HTTP-only cookie is still valid,
 * the backend returns the user and we hydrate state — no localStorage token.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading starts true so ProtectedRoute waits before redirecting to /login
  const [loading, setLoading] = useState(true)

  /**
   * Re-fetch the current user from the cookie session.
   * Used on app load and anytime we need to sync client state with the server.
   */
  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe()
      setUser(data.user)
      return data.user
    } catch {
      // 401 or network failure → treat as logged out
      setUser(null)
      return null
    }
  }, [])

  // Restore session once when the provider mounts
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const data = await authApi.getMe()
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  /** Sign in — cookie is set by the server; we store the returned user */
  const login = async ({ email, password }) => {
    const data = await authApi.login({ email, password })
    setUser(data.user)
    return data
  }

  /** Register — same cookie flow as login (automatic login after signup) */
  const register = async ({ name, email, password }) => {
    const data = await authApi.register({ name, email, password })
    setUser(data.user)
    return data
  }

  /** Sign out — clear cookie server-side and wipe local user state */
  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      // Always clear local state even if the network call fails
      setUser(null)
    }
  }

  /**
   * Merge updated profile fields into the auth user.
   * Used by ProfileContext after edit/avatar upload so name/avatar stay fresh
   * without forcing a full /auth/me round-trip.
   */
  const syncUser = useCallback((userData) => {
    if (!userData) return
    setUser((prev) => (prev ? { ...prev, ...userData } : userData))
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshUser,
    syncUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook for consuming auth state.
 * Throws if used outside AuthProvider so misconfiguration fails loudly.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
