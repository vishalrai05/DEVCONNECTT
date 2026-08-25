/**
 * Login page — Phase 2 wired to real auth API via AuthContext.
 *
 * Flow:
 * 1. User submits email/password
 * 2. AuthContext.login → POST /api/auth/login (sets HTTP-only cookie)
 * 3. On success, redirect to the intended page (or /dashboard)
 * 4. On failure, show a clean, user-friendly error message
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail } from 'lucide-react'
import Logo from '../components/Logo'
import AuthCard from '../components/AuthCard'
import AuthInput from '../components/AuthInput'
import AuthVisualPanel from '../components/AuthVisualPanel'
import GradientButton from '../components/GradientButton'
import GitHubIcon from '../components/GitHubIcon'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where ProtectedRoute wanted to send the user before redirecting here
  const redirectTo = location.state?.from || '/dashboard'

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Client-side validation before hitting the network
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      })
      // Cookie is already set by the server; navigate into the app
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh bg-app lg:grid-cols-2">
      <div className="relative flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="absolute right-4 top-4 lg:hidden">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-md">
          <Logo size="md" />
          <AuthCard className="mt-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-app sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to find teammates and jump into your next hackathon.
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
              <AuthInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
                icon={Mail}
              />
              <AuthInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                icon={Lock}
              />

              {/* Form-level error (invalid credentials, network, server) */}
              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={form.remember}
                    onChange={onChange}
                    className="h-4 w-4 rounded border-app accent-[var(--primary)] focus-ring"
                  />
                  Remember me
                </label>
                <a href="#" className="text-sm font-medium text-[var(--accent)] hover:underline focus-ring rounded">
                  Forgot password?
                </a>
              </div>

              {/* Disabled + spinner while the request is in flight */}
              <GradientButton type="submit" fullWidth className="mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </GradientButton>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-xs uppercase tracking-wider text-muted">or</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <GradientButton type="button" variant="ghost" fullWidth icon={GitHubIcon} disabled={loading}>
              Continue with GitHub
            </GradientButton>

            <p className="mt-6 text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-[var(--accent)] hover:underline focus-ring rounded">
                Sign up
              </Link>
            </p>
          </AuthCard>
        </div>
      </div>

      <AuthVisualPanel />
    </div>
  )
}
