import { api } from './api'

export const chatService = {
  async getFriends() {
    return await api.get('/api/users/friends')
  },

  async getMessages(userId) {
    return await api.get(`/api/users/messages/${userId}`)
  },

  async sendMessage(receiver_id, message) {
    return await api.post('/api/users/messages', {
      receiver_id,
      message: message.trim()
    })
  },

  async createGroup(group_name, member_ids) {
    return await api.post('/api/users/groups', {
      group_name: group_name.trim(),
      member_ids
    })
  },

  async getGroups() {
    return await api.get('/api/users/groups')
  },

  async getGroupMessages(groupId) {
    return await api.get(`/api/users/groups/${groupId}/messages`)
  },

  async sendGroupMessage(groupId, message) {
    return await api.post(`/api/users/groups/${groupId}/messages`, {
      message: message.trim()
    })
  },

  async getGroupMembers(groupId) {
    return await api.get(`/api/users/groups/${groupId}/members`)
  }
}
