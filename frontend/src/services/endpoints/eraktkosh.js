import api from '@/services/api'

export const getStates = () => api.get('/eraktkosh/states')
export const getDistricts = (stateCode) => api.get(`/eraktkosh/states/${stateCode}/districts`)
export const getBloodGroups = () => api.get('/eraktkosh/blood-groups')
export const getComponents = () => api.get('/eraktkosh/components')
export const getAvailability = (params) => api.get('/eraktkosh/availability', { params })
