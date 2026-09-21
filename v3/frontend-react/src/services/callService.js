import { api } from './api'

export const callService = {
  async initiateCall(receiver_id, call_type = 'video') {
    return await api.post('/api/users/call/initiate', {
      receiver_id,
      call_type
    })
  },

  async checkIncomingCall() {
    return await api.get('/api/users/call/status')
  },

  async checkCallStatus(callId) {
    return await api.get(`/api/users/call/check/${callId}`)
  },

  async respondCall(call_id, action) {
    return await api.post('/api/users/call/respond', {
      call_id,
      action // 'accept' | 'reject'
    })
  },

  async cancelCall(call_id) {
    return await api.post('/api/users/call/cancel', {
      call_id
    })
  },

  async sendCallSignal(call_id, type, payload) {
    return await api.post('/api/users/call/signal', {
      call_id,
      type, // 'offer' | 'answer' | 'ice'
      payload
    })
  },

  async getCallSignals(callId) {
    return await api.get(`/api/users/call/signal/${callId}`)
  }
}
