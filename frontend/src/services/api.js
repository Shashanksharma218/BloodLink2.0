import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

// Unwrap success envelope; normalize error shape
api.interceptors.response.use(
  (res) => {
    if (res.status === 204) return null
    return res.data?.data !== undefined ? res.data.data : res.data
  },
  (err) => {
    const status = err.response?.status
    const errBody = err.response?.data?.error
    const serverMessage = errBody?.message || err.response?.data?.message

    if (status === 429) {
      toast.error('Slow down — too many requests.')
    }

    if (status === 401) {
      window.dispatchEvent(new Event('auth:logout'))
    }

    const normalized = new Error(serverMessage || err.message || 'An error occurred')
    normalized.code = errBody?.code
    normalized.details = errBody?.details
    normalized.status = status
    return Promise.reject(normalized)
  }
)

export default api
