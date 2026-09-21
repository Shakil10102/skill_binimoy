import { api } from './api'

export const marketplaceService = {
  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString()
    const endpoint = query ? `/api/users/all?${query}` : '/api/users/all'
    return await api.get(endpoint)
  },

  async getTrendingSkills() {
    return await api.get('/api/users/skills/trending')
  }
}
