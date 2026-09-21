import { api } from './api'

export const callService = {
  async initiateCall(receiverId, callType = 'video') {
    return await api.post('/api/users/call/initiate', {
      receiverId,
      receiver_id: receiverId,
      callType,
      call_type: callType
    })
  },

  async checkIncomingCall() {
    return await api.get('/api/users/call/status')
  },

  async checkCallStatus(callId) {
    return await api.get(`/api/users/call/check/${callId}`)
  },

  async respondCall(callId, action, answer = null) {
    return await api.post('/api/users/call/respond', {
      callId,
      call_id: callId,
      action,
      answer
    })
  },

  async cancelCall(callId) {
    return await api.post('/api/users/call/cancel', {
      callId,
      call_id: callId
    })
  },

  async sendCallSignal(callId, type, payload) {
    return await api.post('/api/users/call/signal', {
      callId,
      call_id: callId,
      role: type,
      type,
      candidate: payload,
      payload
    })
  },

  async getCallSignals(callId, role = 'caller') {
    return await api.get(`/api/users/call/signal/${callId}?role=${role}`)
  }
}
