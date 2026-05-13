import api from '@/services/api'

export const getDonorProfile = () => api.get('/donor/profile')
export const updateDonorProfile = (data) => api.patch('/donor/profile', data)
export const getDonations = (params) => api.get('/donor/donations', { params })
export const getPledges = (params) => api.get('/donor/pledges', { params })
export const getCertificates = (params) => api.get('/donor/certificates', { params })
export const getPendingCertificates = () => api.get('/donor/certificates/pending')
