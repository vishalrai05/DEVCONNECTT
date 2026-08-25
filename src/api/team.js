/**
 * Team API client — Phase 5
 *
 * Covers teams, recruitment posts, join requests, and notifications.
 * All use the shared Axios instance with withCredentials for JWT cookies.
 */

import api, { getErrorMessage } from './auth'

// ---- Teams ----
export const createTeam = async (payload) => {
  const { data } = await api.post('/teams', payload)
  return data
}

export const getTeams = async (params = {}) => {
  const { data } = await api.get('/teams', { params })
  return data
}

export const getTeamById = async (id) => {
  const { data } = await api.get(`/teams/${id}`)
  return data
}

export const updateTeam = async (id, payload) => {
  const { data } = await api.put(`/teams/${id}`, payload)
  return data
}

export const deleteTeam = async (id) => {
  const { data } = await api.delete(`/teams/${id}`)
  return data
}

export const removeMember = async (teamId, userId) => {
  const { data } = await api.delete(`/teams/${teamId}/members/${userId}`)
  return data
}

export const getMyTeams = async () => {
  const { data } = await api.get('/users/teams')
  return data
}

// ---- Recruitment posts ----
export const getTeamPosts = async (params = {}) => {
  const { data } = await api.get('/team-posts', { params })
  return data
}

export const createTeamPost = async (payload) => {
  const { data } = await api.post('/team-posts', payload)
  return data
}

export const updateTeamPost = async (id, payload) => {
  const { data } = await api.put(`/team-posts/${id}`, payload)
  return data
}

export const deactivateTeamPost = async (id) => {
  const { data } = await api.delete(`/team-posts/${id}`)
  return data
}

// ---- Join requests ----
export const sendJoinRequest = async (teamId, message) => {
  const { data } = await api.post(`/teams/${teamId}/join`, { message })
  return data
}

export const getTeamRequests = async (teamId, status = 'pending') => {
  const { data } = await api.get(`/teams/${teamId}/requests`, { params: { status } })
  return data
}

export const acceptRequest = async (requestId) => {
  const { data } = await api.put(`/requests/${requestId}/accept`)
  return data
}

export const rejectRequest = async (requestId) => {
  const { data } = await api.put(`/requests/${requestId}/reject`)
  return data
}

export const cancelRequest = async (requestId) => {
  const { data } = await api.delete(`/requests/${requestId}`)
  return data
}

// ---- Notifications ----
export const getNotifications = async () => {
  const { data } = await api.get('/users/notifications')
  return data
}

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/users/notifications/${id}/read`)
  return data
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.put('/users/notifications/read-all')
  return data
}

export { getErrorMessage }
