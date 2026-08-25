/**
 * Profile API client — Phase 3
 *
 * Why a separate user.js module?
 * Auth endpoints live in auth.js; profile CRUD / avatar upload live here so
 * each page imports only what it needs. Both share the same Axios instance
 * (withCredentials) so the HTTP-only JWT cookie is always sent.
 *
 * Data flow:
 *   EditProfile / AvatarUpload → these functions → Express /api/users/*
 *   → MongoDB (and Cloudinary for images) → response.user → ProfileContext
 */

import api, { getErrorMessage } from './auth'

/** GET /api/users/me — full private profile for the logged-in user */
export const getMyProfile = async () => {
  const { data } = await api.get('/users/me')
  return data
}

/** PUT /api/users/me — partial profile update (validated on the server) */
export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/me', payload)
  return data
}

/** GET /api/users/:id — public projection (no email/password) */
export const getPublicProfile = async (id) => {
  const { data } = await api.get(`/users/${id}`)
  return data
}

/**
 * POST /api/users/me/avatar — multipart upload
 * onUploadProgress lets AvatarUpload show a progress bar.
 */
export const uploadAvatar = async (file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const { data } = await api.post('/users/me/avatar', formData, {
    // Let Axios set multipart boundary automatically (do not force JSON headers)
    headers: { 'Content-Type': undefined },
    onUploadProgress,
  })

  return data
}

export { getErrorMessage }
