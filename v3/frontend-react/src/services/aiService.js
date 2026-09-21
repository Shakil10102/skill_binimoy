import { api } from './api'

export const aiService = {
  async sendMessage(message, history = []) {
    return await api.post('/api/users/chatbot', {
      message,
      history
    })
  }
}
