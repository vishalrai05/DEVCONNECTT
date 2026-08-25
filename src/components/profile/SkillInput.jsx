/**
 * SkillInput — chip/tag input for developer skills
 *
 * Behavior (matches Phase 3 spec):
 * - type a skill → press Enter (or comma) → create chip
 * - remove chip via X
 * - prevent duplicates (case-insensitive)
 * - hard cap at MAX_SKILLS (20)
 *
 * Why controlled `value` / `onChange`?
 * React Hook Form (and ProfileContext) own the skills array; this component
 * is a controlled UI widget that mutates that array through onChange.
 */

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import SkillChip from './SkillChip'
import { MAX_SKILLS } from '../../utils/profile'

export default function SkillInput({
  value = [],
  onChange,
  max = MAX_SKILLS,
  error,
  disabled = false,
}) {
  const [draft, setDraft] = useState('')
  const [localError, setLocalError] = useState('')

  const commitSkill = (raw) => {
    const skill = String(raw).trim().replace(/,$/, '')
    if (!skill) return

    const exists = value.some((s) => s.toLowerCase() === skill.toLowerCase())
    if (exists) {
      setLocalError('That skill is already added.')
      return
    }

    if (value.length >= max) {
      setLocalError(`You can add at most ${max} skills.`)
      return
    }

    setLocalError('')
    onChange([...value, skill])
    setDraft('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitSkill(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      // Convenience: backspace on empty input removes the last chip
      onChange(value.slice(0, -1))
    }
  }

  const removeSkill = (skill) => {
    onChange(value.filter((s) => s !== skill))
    setLocalError('')
  }

  const message = error || localError

  return (
    <div className="w-full space-y-2">
      <div
        className={`rounded-2xl border bg-[var(--surface)] px-3 py-2.5 transition-colors ${
          message
            ? 'border-red-500/70'
            : 'border-app focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_var(--glow)]'
        }`}
      >
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {value.map((skill) => (
              <SkillChip
                key={skill}
                skill={skill}
                onRemove={disabled ? undefined : removeSkill}
              />
            ))}
          </AnimatePresence>

          <input
            type="text"
            value={draft}
            disabled={disabled || value.length >= max}
            onChange={(e) => {
              setDraft(e.target.value)
              if (localError) setLocalError('')
            }}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (draft.trim()) commitSkill(draft)
            }}
            placeholder={
              value.length >= max
                ? 'Skill limit reached'
                : value.length
                  ? 'Add another skill…'
                  : 'Type a skill and press Enter'
            }
            className="min-w-[10rem] flex-1 bg-transparent py-1 text-sm text-app placeholder:text-muted/70 outline-none disabled:cursor-not-allowed"
            aria-label="Add skill"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {value.length}/{max} skills
          {message ? (
            <span className="ml-2 text-red-400" role="alert">
              {message}
            </span>
          ) : null}
        </span>
        <span className="hidden sm:inline">Enter or comma to add</span>
      </div>
    </div>
  )
}
