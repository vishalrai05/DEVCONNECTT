/**
 * ProtectedRoute — gate for authenticated-only pages
 *
 * Why protect routes on the frontend?
 * Backend middleware is the real security boundary. This component improves UX:
 * unauthenticated users are redirected to /login instead of seeing a broken page.
 *
 * Flow:
 * 1. While AuthContext is still checking /me → show a loading screen
 * 2. If no user → redirect to /login (preserve intended destination)
 * 3. If user exists → render the protected children
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Wait for the initial /me check so we don't flash-redirect logged-in users
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]"
            aria-hidden
          />
          <p className="text-sm text-muted">Checking authentication…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Replace history entry; state.from lets Login redirect back after success
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
