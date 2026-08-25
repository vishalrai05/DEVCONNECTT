/**
 * SignUp page — Phase 2 registration + automatic login.
 *
 * Flow:
 * 1. Validate fields (required, email shape, password length, confirmation match)
 * 2. AuthContext.register → POST /api/auth/register
 * 3. Server hashes password, creates user, sets JWT cookie
 * 4. Redirect to /dashboard (user is already logged in)
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail, User } from 'lucide-react'
import Logo from '../components/Logo'
import AuthCard from '../components/AuthCard'
import AuthInput from '../components/AuthInput'
import AuthVisualPanel from '../components/AuthVisualPanel'
import GradientButton from '../components/GradientButton'
import GitHubIcon from '../components/GitHubIcon'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/auth'

export default function SignUp() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  /** Client-side checks before calling the API — faster feedback, fewer bad requests */
  const validate = () => {
    const next = {}

    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = 'Please enter your full name (at least 2 characters).'
    }

    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.'
    }

    if (!form.password || form.password.length < 6) {
      next.password = 'Password must be at least 6 characters.'
    }

    if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)

    try {
      // Register also sets the auth cookie — no separate login call needed
      await register({
        name: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
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
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted">
              Join DevConnect and start building your next hackathon team.
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
              <AuthInput
                label="Full Name"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={onChange}
                placeholder="Alex Rivera"
                autoComplete="name"
                required
                icon={User}
                error={fieldErrors.fullName}
              />
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
                error={fieldErrors.email}
              />
              <AuthInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                placeholder="Create a password"
                autoComplete="new-password"
                required
                icon={Lock}
                error={fieldErrors.password}
              />
              <AuthInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                icon={Lock}
                error={fieldErrors.confirmPassword}
              />

              {/* API errors: email already exists, validation, network, server */}
              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                  {error}
                </p>
              ) : null}

              <GradientButton type="submit" fullWidth className="mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
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
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline focus-ring rounded">
                Log in
              </Link>
            </p>
          </AuthCard>
        </div>
      </div>

      <AuthVisualPanel
        title="Assemble your dream hackathon squad"
        subtitle="Thousands of developers are forming teams right now. Claim your seat before the next kickoff."
      />
    </div>
  )
}
