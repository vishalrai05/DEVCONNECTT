/**
 * EditProfile — React Hook Form driven profile editor
 *
 * Why React Hook Form?
 * It keeps large forms performant (uncontrolled inputs + register) while still
 * supporting controlled widgets (skills chips, segmented experience).
 *
 * Save flow:
 *   validate locally → ProfileContext.updateProfile(payload)
 *   → PUT /api/users/me → MongoDB → optimistic UI already applied
 * Avatar uploads go through a separate endpoint so progress can be tracked.
 */

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Save } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import AvatarUpload from '../components/profile/AvatarUpload'
import SkillInput from '../components/profile/SkillInput'
import { useProfile } from '../context/ProfileContext'
import { getErrorMessage } from '../api/user'
import {
  AVAILABILITY_OPTIONS,
  BIO_MAX_LENGTH,
  EXPERIENCE_LEVELS,
  PREFERRED_ROLES,
  PROJECT_INTERESTS,
  YEAR_OPTIONS,
  isOptionalUrl,
} from '../utils/profile'
import { cn } from '../utils/cn'

const fieldClass =
  'w-full rounded-2xl border border-app bg-[var(--surface)] px-4 py-3 text-sm text-app placeholder:text-muted/70 transition-all focus-ring hover:border-blue-500/40 focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--glow)]'

const labelClass = 'mb-1.5 block text-sm font-medium text-app'

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1.5 text-xs text-red-400" role="alert">
      {message}
    </p>
  )
}

export default function EditProfile() {
  const navigate = useNavigate()
  const { profile, loading, updating, updateProfile, uploadAvatar } = useProfile()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: '',
      bio: '',
      college: '',
      branch: '',
      year: '',
      preferredRole: '',
      experienceLevel: '',
      availability: '',
      projectInterests: [],
      github: '',
      linkedin: '',
      portfolio: '',
      skills: [],
    },
  })

  // Hydrate the form once ProfileContext finishes loading
  useEffect(() => {
    if (!profile) return
    reset({
      name: profile.name || '',
      bio: profile.bio || '',
      college: profile.college || '',
      branch: profile.branch || '',
      year: profile.year || '',
      preferredRole: profile.preferredRole || '',
      experienceLevel: profile.experienceLevel || '',
      availability: profile.availability || '',
      projectInterests: profile.projectInterests || [],
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      portfolio: profile.portfolio || '',
      skills: profile.skills || [],
    })
  }, [profile, reset])

  const bioValue = watch('bio') || ''
  const bioRemaining = BIO_MAX_LENGTH - bioValue.length

  const onSubmit = async (values) => {
    try {
      await updateProfile({
        name: values.name.trim(),
        bio: values.bio.trim(),
        college: values.college.trim(),
        branch: values.branch.trim(),
        year: values.year,
        preferredRole: values.preferredRole,
        experienceLevel: values.experienceLevel,
        availability: values.availability,
        projectInterests: values.projectInterests,
        github: values.github.trim(),
        linkedin: values.linkedin.trim(),
        portfolio: values.portfolio.trim(),
        skills: values.skills,
      })
      navigate('/dashboard')
    } catch (err) {
      setError('root', { message: getErrorMessage(err) })
    }
  }

  if (loading && !profile) {
    return (
      <AppShell title="Edit profile">
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Edit profile"
      description="Tell teammates who you are — skills, role, and availability power matching later."
    >
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-[240px_1fr]"
        noValidate
      >
        <section className="h-fit rounded-3xl border border-app glass p-6">
          <AvatarUpload
            name={profile?.name}
            avatar={profile?.avatar}
            onUpload={uploadAvatar}
            disabled={updating}
          />
        </section>

        <section className="space-y-6 rounded-3xl border border-app glass p-6 sm:p-8">
          <div>
            <label className={labelClass} htmlFor="name">
              Full Name <span className="text-[var(--primary)]">*</span>
            </label>
            <input
              id="name"
              className={fieldClass}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-app" htmlFor="bio">
                Bio
              </label>
              <span
                className={cn(
                  'text-xs',
                  bioRemaining < 30 ? 'text-amber-500' : 'text-muted',
                  bioRemaining < 0 && 'text-red-400',
                )}
              >
                {bioRemaining} characters left
              </span>
            </div>
            <textarea
              id="bio"
              rows={4}
              className={cn(fieldClass, 'resize-y min-h-[7rem]')}
              placeholder="What do you love building at hackathons?"
              {...register('bio', {
                maxLength: {
                  value: BIO_MAX_LENGTH,
                  message: `Bio cannot exceed ${BIO_MAX_LENGTH} characters`,
                },
              })}
            />
            <FieldError message={errors.bio?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="college">
                College
              </label>
              <input id="college" className={fieldClass} placeholder="Your university" {...register('college')} />
            </div>
            <div>
              <label className={labelClass} htmlFor="branch">
                Branch
              </label>
              <input id="branch" className={fieldClass} placeholder="CSE / IT / …" {...register('branch')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="year">
                Year
              </label>
              <select id="year" className={fieldClass} {...register('year')}>
                <option value="">Select year</option>
                {YEAR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="preferredRole">
                Preferred Role
              </label>
              <select id="preferredRole" className={fieldClass} {...register('preferredRole')}>
                <option value="">Select role</option>
                {PREFERRED_ROLES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segmented control for experience — Controller bridges RHF ↔ custom UI */}
          <div>
            <p className={labelClass}>Experience Level</p>
            <Controller
              name="experienceLevel"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-app bg-[var(--surface)] p-1.5">
                  {EXPERIENCE_LEVELS.map((level) => {
                    const active = field.value === level
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => field.onChange(level)}
                        className={cn(
                          'rounded-xl px-2 py-2.5 text-xs font-medium transition-all sm:text-sm focus-ring',
                          active
                            ? 'bg-[var(--primary)] text-white shadow-md shadow-blue-600/25'
                            : 'text-muted hover:text-app',
                        )}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="availability">
              Availability
            </label>
            <select id="availability" className={fieldClass} {...register('availability')}>
              <option value="">Select availability</option>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className={labelClass}>Project interests</p>
            <p className="mb-2 text-xs text-muted">Choose the kinds of projects you want to build.</p>
            <Controller
              name="projectInterests"
              control={control}
              rules={{ validate: (items) => items.length <= 10 || 'Choose at most 10 interests' }}
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROJECT_INTERESTS.map((interest) => {
                    const active = (field.value || []).includes(interest)
                    return (
                      <label
                        key={interest}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-app'
                            : 'border-app text-muted hover:text-app',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            field.onChange(
                              active
                                ? field.value.filter((item) => item !== interest)
                                : [...(field.value || []), interest],
                            )
                          }
                          className="accent-[var(--primary)]"
                        />
                        {interest}
                      </label>
                    )
                  })}
                </div>
              )}
            />
            <FieldError message={errors.projectInterests?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-1">
            <div>
              <label className={labelClass} htmlFor="github">
                GitHub URL
              </label>
              <input
                id="github"
                className={fieldClass}
                placeholder="https://github.com/username"
                {...register('github', {
                  validate: (v) => isOptionalUrl(v) || 'Enter a valid GitHub URL',
                })}
              />
              <FieldError message={errors.github?.message} />
            </div>
            <div>
              <label className={labelClass} htmlFor="linkedin">
                LinkedIn URL
              </label>
              <input
                id="linkedin"
                className={fieldClass}
                placeholder="https://linkedin.com/in/username"
                {...register('linkedin', {
                  validate: (v) => isOptionalUrl(v) || 'Enter a valid LinkedIn URL',
                })}
              />
              <FieldError message={errors.linkedin?.message} />
            </div>
            <div>
              <label className={labelClass} htmlFor="portfolio">
                Portfolio URL
              </label>
              <input
                id="portfolio"
                className={fieldClass}
                placeholder="https://your-site.com"
                {...register('portfolio', {
                  validate: (v) => isOptionalUrl(v) || 'Enter a valid portfolio URL',
                })}
              />
              <FieldError message={errors.portfolio?.message} />
            </div>
          </div>

          <div>
            <p className={labelClass}>Skills</p>
            <Controller
              name="skills"
              control={control}
              rules={{
                validate: (skills) =>
                  !skills || skills.length <= 20 || 'You can add at most 20 skills',
              }}
              render={({ field }) => (
                <SkillInput
                  value={field.value || []}
                  onChange={field.onChange}
                  error={errors.skills?.message}
                  disabled={updating}
                />
              )}
            />
          </div>

          {errors.root?.message ? (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <GradientButton type="submit" disabled={updating} className="!px-5">
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isDirty ? 'Save changes' : 'Save profile'}
                </>
              )}
            </GradientButton>
            <GradientButton
              type="button"
              variant="ghost"
              disabled={updating}
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </GradientButton>
          </div>
        </section>
      </motion.form>
    </AppShell>
  )
}
