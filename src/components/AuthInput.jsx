import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../utils/cn'

export default function AuthInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  icon: Icon,
  error,
}) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="w-full space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-app">
        {label}
        {required ? <span className="text-[var(--primary)] ml-0.5">*</span> : null}
      </label>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
        ) : null}
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'w-full rounded-2xl border border-app bg-[var(--surface)] px-4 py-3 text-sm text-app placeholder:text-muted/70 transition-all duration-200 focus-ring',
            'hover:border-blue-500/40',
            'focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--glow)]',
            Icon && 'pl-10',
            isPassword && 'pr-11',
            error && 'border-red-500/70 focus:border-red-500',
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-app focus-ring"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
