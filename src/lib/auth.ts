import { api, clearAuth } from './api'
import type { TokenResponse, MessageResponse } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>('/admin/auth/login', { email, password }).then((r) => r.data),

  logout: (refresh_token: string) =>
    api.post<MessageResponse>('/admin/auth/logout', { refresh_token }).then((r) => r.data),

  verifyOtp: (email: string, otp_code: string) =>
    api.post<TokenResponse>('/admin/auth/otp/verify', { email, otp_code }).then((r) => r.data),

  requestPasswordRecovery: (email: string) =>
    api.post('/admin/auth/password-recovery/request', { email }).then((r) => r.data),

  confirmPasswordRecovery: (email: string, otp_code: string, new_password: string) =>
    api
      .post('/admin/auth/password-recovery/confirm', { email, otp_code, new_password })
      .then((r) => r.data),
}

export const setTokens = (tokens: TokenResponse) => {
  localStorage.setItem('access_token', tokens.access_token)
  localStorage.setItem('refresh_token', tokens.refresh_token)
}

export const getAccessToken = () => localStorage.getItem('access_token')

export const logout = async () => {
  const refresh_token = localStorage.getItem('refresh_token')
  if (refresh_token) {
    try {
      await authApi.logout(refresh_token)
    } catch {
      // ignore
    }
  }
  clearAuth()
}
