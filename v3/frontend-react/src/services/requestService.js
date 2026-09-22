import { api } from './api'

export const requestService = {
  async sendRequest({ receiver_id, offered_skill, requested_skill, message }) {
    return await api.post('/api/users/requests', {
      receiver_id,
      offered_skill: offered_skill.trim(),
      requested_skill: requested_skill.trim(),
      message: message ? message.trim() : ''
    })
  },

  async getRequests() {
    return await api.get('/api/users/requests')
  },

  async updateRequest(requestId, status) {
    return await api.put(`/api/users/requests/${requestId}`, {
      status
    })
  },

  async getFriends() {
    return await api.get('/api/users/friends')
  }
}
