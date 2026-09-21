import { api } from './api'

export const sessionService = {
  async getSessions() {
    return await api.get('/api/users/sessions')
  },

  async createSession({ request_id, scheduled_at, duration_minutes = 20, meeting_link = '' }) {
    return await api.post('/api/users/sessions', {
      request_id,
      scheduled_at,
      duration_minutes: parseInt(duration_minutes, 10),
      meeting_link: meeting_link.trim()
    })
  },

  async generateVideoRoom(type, target_id, duration_limit = 20) {
    return await api.post('/api/users/video-room', {
      type,
      target_id,
      duration_limit
    })
  }
}
