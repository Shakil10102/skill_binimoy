import { api, setToken, setCurrentUser, removeToken } from './api'

export const authService = {
  async register(full_name, email, password) {
    return await api.post('/api/users/register', {
      full_name,
      email: email.trim().toLowerCase(),
      password
    })
  },

  async verifyEmail(email, code) {
    return await api.post('/api/users/verify-email', {
      email: email.trim().toLowerCase(),
      code: code.trim()
    })
  },

  async resendCode(email) {
    return await api.post('/api/users/resend-code', {
      email: email.trim().toLowerCase()
    })
  },

  async login(email, password) {
    const data = await api.post('/api/users/login', {
      email: email.trim().toLowerCase(),
      password
    })
    if (data.token && data.user) {
      setToken(data.token)
      setCurrentUser(data.user)
    }
    return data
  },

  async forgotPassword(email) {
    return await api.post('/api/users/forgot-password', {
      email: email.trim().toLowerCase()
    })
  },

  async resetPassword(email, code, newPassword) {
    return await api.post('/api/users/reset-password', {
      email: email.trim().toLowerCase(),
      code: code.trim(),
      newPassword
    })
  },

  logout() {
    removeToken()
  }
}
