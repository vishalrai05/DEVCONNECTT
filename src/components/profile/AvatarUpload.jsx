/**
 * AvatarUpload — pick image, preview locally, upload to Cloudinary via API
 *
 * Why preview before upload?
 * Users should confirm the crop framing before we spend a Cloudinary upload
 * and replace their old avatar. Progress state comes from Axios onUploadProgress.
 *
 * Data flow:
 *   file input → local object URL preview → uploadAvatar(file)
 *   → POST /api/users/me/avatar → Cloudinary → MongoDB avatar URL
 *   → ProfileContext updates profile + AuthContext syncUser
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Loader2 } from 'lucide-react'
import { getInitials } from '../../utils/profile'
import { cn } from '../../utils/cn'

export default function AvatarUpload({
  name,
  avatar,
  onUpload,
  disabled = false,
  size = 'lg',
}) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Revoke object URLs to avoid memory leaks when preview changes/unmounts
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const displaySrc = preview || avatar
  const dim = size === 'sm' ? 'h-20 w-20' : size === 'md' ? 'h-28 w-28' : 'h-32 w-32'

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.')
      return
    }

    setError('')
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setProgress(0)

    try {
      await onUpload(file, (event) => {
        if (!event.total) return
        setProgress(Math.round((event.loaded / event.total) * 100))
      })
      setProgress(100)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Upload failed.')
      // Drop failed preview so we show the previous server avatar again
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        whileHover={disabled || uploading ? undefined : { scale: 1.03 }}
        whileTap={disabled || uploading ? undefined : { scale: 0.98 }}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={cn(
          'group relative overflow-hidden rounded-full border-2 border-app bg-[var(--surface)] shadow-lg focus-ring',
          dim,
          (disabled || uploading) && 'opacity-70 cursor-not-allowed',
        )}
        aria-label="Upload avatar"
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-[var(--accent)]">
            {getInitials(name)}
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </span>
      </motion.button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || uploading}
      />

      {uploading ? (
        <div className="w-40 space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
            <motion.div
              className="h-full rounded-full bg-[var(--primary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
            />
          </div>
          <p className="text-center text-xs text-muted">Uploading {progress}%</p>
        </div>
      ) : (
        <p className="text-xs text-muted">Click to upload a new photo</p>
      )}

      {error ? (
        <p className="text-center text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
