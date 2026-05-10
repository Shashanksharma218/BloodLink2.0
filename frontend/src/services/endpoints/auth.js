import api from '@/services/api'

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const logout = () => api.post('/auth/logout')
export const me = () => api.get('/auth/me')
export const changePassword = (data) => api.patch('/auth/password', data)

export const verifyEmail = (params) => api.get('/auth/verify-email', { params })
export const resendVerification = () => api.post('/auth/resend-verification')

export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword = (data) => api.post('/auth/reset-password', data)
