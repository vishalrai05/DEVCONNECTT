/**
 * ProfileContext — Phase 3 profile state
 *
 * Why a dedicated ProfileContext (vs only AuthContext)?
 * Auth cares about "who is logged in". Profile cares about rich editable
 * fields, loading/updating flags, and optimistic updates while editing.
 * Splitting them keeps login logic simple and profile UX responsive.
 *
 * syncUser from AuthContext keeps the navbar / session user in sync when
 * the profile name or avatar changes.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as userApi from '../api/user'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user: authUser, isAuthenticated, syncUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  /**
   * Load / refresh the private profile from GET /api/users/me.
   * Called on mount (when authenticated) and after some mutations.
   */
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    try {
      const data = await userApi.getMyProfile()
      setProfile(data.user)
      // Keep AuthContext user fields aligned (name/avatar/etc.)
      syncUser?.(data.user)
      return data.user
    } catch {
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, syncUser])

  // When auth resolves to a logged-in user, hydrate profile once
  useEffect(() => {
    if (!authUser) {
      setProfile(null)
      setLoading(false)
      return
    }
    fetchProfile()
  }, [authUser?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Optimistic update:
   * 1. Immediately merge fields into local profile (snappy UI)
   * 2. Persist via PUT /api/users/me
   * 3. On failure, roll back to the previous snapshot
   */
  const updateProfile = async (payload) => {
    const previous = profile
    setUpdating(true)

    if (previous) {
      setProfile({ ...previous, ...payload })
    }

    try {
      const data = await userApi.updateProfile(payload)
      setProfile(data.user)
      syncUser?.(data.user)
      return data
    } catch (error) {
      setProfile(previous)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  /**
   * Upload avatar file → Cloudinary (server) → updated user document.
   * We set updating so Dashboard/EditProfile can disable actions during upload.
   */
  const uploadAvatar = async (file, onUploadProgress) => {
    setUpdating(true)
    try {
      const data = await userApi.uploadAvatar(file, onUploadProgress)
      setProfile(data.user)
      syncUser?.(data.user)
      return data
    } finally {
      setUpdating(false)
    }
  }

  const value = {
    profile,
    loading,
    updating,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    setProfile,
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
