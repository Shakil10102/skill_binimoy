import { api } from './api'

export const callService = {
  async initiateCall(receiverId, callType = 'video', offer = null) {
    return await api.post('/api/users/call/initiate', {
      receiverId,
      receiver_id: receiverId,
      callType,
      call_type: callType,
      offer
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

  async sendCallSignal(callId, type, payload, role = 'caller') {
    return await api.post('/api/users/call/signal', {
      callId,
      call_id: callId,
      role,
      type,
      candidate: type === 'ice' ? payload : undefined,
      offer: type === 'offer' ? payload : undefined,
      answer: type === 'answer' ? payload : undefined,
      payload
    })
  },

  async getCallSignals(callId, role = 'caller') {
    return await api.get(`/api/users/call/signal/${callId}?role=${role}`)
  }
}
