import axios from 'axios'
import toast from 'react-hot-toast'
import {
  isQueueable, isCacheable, newKey, QUEUE_TIMEOUT_MS, enqueueFromConfig, saveCache, readCache,
} from '../lib/offlineQueue'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Registros que se pueden guardar sin internet: cada uno lleva una clave única para que, si se
  // reintenta, el servidor no lo registre dos veces. Si no hay respuesta a tiempo, se guarda en el celular.
  if (isQueueable(config) && !config.__sync) {
    config.headers['Idempotency-Key'] = config.headers['Idempotency-Key'] || newKey()
    if (!config.timeout) config.timeout = QUEUE_TIMEOUT_MS
  }
  return config
})

const isNetworkFailure = (error) =>
  !error.response && error.code !== 'ERR_CANCELED' &&
  (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || !navigator.onLine)

api.interceptors.response.use(
  (response) => {
    // Se guarda la última lista vista para poder consultarla sin internet
    if (isCacheable(response.config)) saveCache(response.config, response.data)
    return response
  },
  async (error) => {
    const cfg = error.config
    if (cfg && !cfg.__sync && isNetworkFailure(error)) {
      if (isQueueable(cfg)) {
        try {
          await enqueueFromConfig(cfg)
          toast('Sin conexión: se guardó en tu celular y se subirá solo cuando haya internet', { id: 'offline-saved', icon: '📴', duration: 4500 })
          return { data: { queued: true, offline: true }, status: 202, statusText: 'Accepted (guardado sin conexión)', headers: {}, config: cfg }
        } catch { /* si no se pudo guardar localmente, falla como siempre */ }
      } else if (isCacheable(cfg)) {
        const cached = await readCache(cfg)
        if (cached) return { data: cached, status: 200, statusText: 'OK (datos guardados)', headers: {}, config: cfg, fromCache: true }
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    // Un lector intentó guardar algo: el servidor lo rechaza y se le explica
    if (error.response?.status === 403 && error.response.data?.code === 'READ_ONLY') {
      toast.error(error.response.data.message, { id: 'read-only' })
    }
    return Promise.reject(error)
  }
)

export default api