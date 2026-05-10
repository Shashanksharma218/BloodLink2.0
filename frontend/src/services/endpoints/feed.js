import api from '@/services/api'

export const getDonorFeed = (params) => api.get('/requests/feed', { params })
