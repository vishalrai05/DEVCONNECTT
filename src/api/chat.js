import api, { getErrorMessage } from './auth'

export const getTeamMessages = async (teamId, params = {}) => {
  const { data } = await api.get(`/teams/${teamId}/messages`, { params })
  return data
}

export { getErrorMessage }
