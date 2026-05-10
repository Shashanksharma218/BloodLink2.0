import api from '@/services/api'

export const downloadCertificate = (id) =>
  api.get(`/certificates/${id}/download`, { responseType: 'blob' })

export const verifyCertificate = (verificationId) =>
  api.get(`/verify/${verificationId}`)
