import toast from 'react-hot-toast'
import api from '../services/api'
import { listQueue, removeQueueItem, updateQueueItem, notifyQueueChanged } from './offlineQueue'

let running = false
const syncListeners = new Set()
export const onSyncingChange = (fn) => { syncListeners.add(fn); return () => syncListeners.delete(fn) }
const setRunning = (v) => { running = v; syncListeners.forEach((fn) => fn(v)) }
export const isSyncing = () => running

// Sube los registros guardados sin internet, uno por uno y en orden.
// Cada uno viaja con su clave única: si el servidor ya lo había recibido, no lo duplica.
export async function syncQueue() {
  if (running || !navigator.onLine || !localStorage.getItem('token')) return
  setRunning(true)
  let uploaded = 0
  try {
    const items = (await listQueue()).filter((i) => i.status === 'pending')
    for (const item of items) {
      try {
        await api.post(item.url, item.body, { __sync: true, headers: { 'Idempotency-Key': item.id }, timeout: 30000 })
        await removeQueueItem(item.id)
        uploaded += 1
      } catch (err) {
        const status = err.response?.status
        const code = err.response?.data?.code
        const retryLater = !err.response || status >= 500 || status === 429 || status === 408 ||
          (status === 409 && code === 'IDEMPOTENCY_IN_PROGRESS')
        if (status === 401) break // la sesión venció: al volver a entrar se continúa
        if (retryLater) {
          await updateQueueItem(item.id, { attempts: (item.attempts || 0) + 1 })
          break // se reintenta más tarde, conservando el orden
        }
        // El servidor lo rechazó (dato inválido, sin permiso...). Nada se borra: queda a la vista para decidir.
        const message = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'El servidor rechazó este registro'
        await updateQueueItem(item.id, { status: 'failed', error: message })
      }
    }
  } finally {
    setRunning(false)
    notifyQueueChanged()
  }
  if (uploaded > 0) {
    toast(
      (t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Se subieron {uploaded} {uploaded === 1 ? 'registro' : 'registros'} guardados sin internet
          <button
            type="button"
            onClick={() => { toast.dismiss(t.id); window.location.reload() }}
            style={{ background: '#2d6f43', color: '#fff', borderRadius: 10, padding: '4px 12px', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Actualizar pantalla
          </button>
        </span>
      ),
      { id: 'offline-synced', icon: '✅', duration: 8000 }
    )
  }
}

export const retryItem = async (id) => {
  await updateQueueItem(id, { status: 'pending', error: null })
  return syncQueue()
}