import api from '@/services/api'

export const createRequest = (formData) =>
  api.post('/requests', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getMyRequests = (params) => api.get('/requests', { params })
export const getRequest = (id) => api.get(`/requests/${id}`)
export const cancelRequest = (id, body) => api.patch(`/requests/${id}/cancel`, body)
export const getRequestPledges = (id) => api.get(`/requests/${id}/pledges`)
