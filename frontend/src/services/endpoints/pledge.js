import api from '@/services/api'

export const acceptPledge = (requestId) => api.post(`/requests/${requestId}/pledges`)
export const getPledge = (id) => api.get(`/pledges/${id}`)
export const cancelPledge = (id, body) => api.patch(`/pledges/${id}/cancel`, body)
