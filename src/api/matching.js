/**
 * Matching API client — Phase 6
 */

import api, { getErrorMessage } from './auth'

/** GET /api/matching/recommendations */
export const getRecommendations = async (params = {}) => {
  const { data } = await api.get('/matching/recommendations', { params })
  return data
}

/** GET /api/matching/meta — filter option lists */
export const getMatchingMeta = async () => {
  const { data } = await api.get('/matching/meta')
  return data
}

/**
 * POST /api/matching/invite
 * Invite a recommended user to one of your recruiting teams.
 */
export const inviteToTeam = async ({ teamId, userId, message }) => {
  const { data } = await api.post('/matching/invite', { teamId, userId, message })
  return data
}

export { getErrorMessage }
