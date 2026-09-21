import { api } from './api'

export const marketplaceService = {
  async getAllUsers() {
    return await api.get('/api/users/all')
  },

  async getTrendingSkills() {
    return await api.get('/api/users/skills/trending')
  }
}
