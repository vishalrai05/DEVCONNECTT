/**
 * Hackathon API client — Phase 4
 *
 * How search works: pass `search` in params → backend $or regex on title,
 * organizer, domains, requiredSkills.
 *
 * How filters work: each filter key maps to a query param consumed by
 * buildListFilter() on the server (mode, difficulty, domain, teamSize, …).
 *
 * How bookmarks work: POST/DELETE /hackathons/:id/bookmark mutates the
 * User.bookmarkedHackathons array; GET /users/bookmarks returns populated docs.
 */

import api, { getErrorMessage } from './auth'

/** GET /api/hackathons — list with search, filters, sort, pagination */
export const getHackathons = async (params = {}) => {
  const { data } = await api.get('/hackathons', { params })
  return data
}

/** GET /api/hackathons/featured */
export const getFeaturedHackathons = async () => {
  const { data } = await api.get('/hackathons/featured')
  return data
}

/** GET /api/hackathons/stats */
export const getHackathonStats = async () => {
  const { data } = await api.get('/hackathons/stats')
  return data
}

/** GET /api/hackathons/recommended — requires auth cookie */
export const getRecommendedHackathons = async () => {
  const { data } = await api.get('/hackathons/recommended')
  return data
}

/** GET /api/hackathons/:id */
export const getHackathonById = async (id) => {
  const { data } = await api.get(`/hackathons/${id}`)
  return data
}

/** POST /api/hackathons — admin create */
export const createHackathon = async (payload) => {
  const { data } = await api.post('/hackathons', payload)
  return data
}

/** PUT /api/hackathons/:id — admin update */
export const updateHackathon = async (id, payload) => {
  const { data } = await api.put(`/hackathons/${id}`, payload)
  return data
}

/** DELETE /api/hackathons/:id — admin delete */
export const deleteHackathon = async (id) => {
  const { data } = await api.delete(`/hackathons/${id}`)
  return data
}

/** POST /api/hackathons/:id/bookmark */
export const bookmarkHackathon = async (id) => {
  const { data } = await api.post(`/hackathons/${id}/bookmark`)
  return data
}

/** DELETE /api/hackathons/:id/bookmark */
export const unbookmarkHackathon = async (id) => {
  const { data } = await api.delete(`/hackathons/${id}/bookmark`)
  return data
}

/** GET /api/users/bookmarks */
export const getMyBookmarks = async () => {
  const { data } = await api.get('/users/bookmarks')
  return data
}

export { getErrorMessage }
