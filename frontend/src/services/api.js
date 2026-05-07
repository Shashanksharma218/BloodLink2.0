import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

export const authApi = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const donorApi = {
  getStatus: () => api.get('/donors/status').then((r) => r.data),
  setAvailability: (preference, reason) =>
    api.put('/donors/availability', { preference, reason }).then((r) => r.data),
}

export default api
