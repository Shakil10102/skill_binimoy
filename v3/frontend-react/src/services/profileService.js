import { api, setCurrentUser } from './api'

export const profileService = {
  async getProfile() {
    const data = await api.get('/api/users/profile')
    if (data.user) {
      setCurrentUser(data.user)
    }
    return data
  },

  async updateProfile({ full_name, bio, profile_image, cover_image }) {
    const data = await api.put('/api/users/profile', {
      full_name,
      bio,
      profile_image,
      cover_image
    })
    if (data.user) {
      setCurrentUser(data.user)
    }
    return data
  },

  async addSkill(skill_name, skill_type) {
    return await api.post('/api/users/skills', {
      skill_name: skill_name.trim(),
      skill_type
    })
  },

  async deleteSkill(skillId) {
    return await api.delete(`/api/users/skills/${skillId}`)
  },

  async getReviews(userId) {
    return await api.get(`/api/users/reviews/${userId}`)
  }
}
