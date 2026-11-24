import { dbGetAll, dbGet, dbPut, dbDelete, dbClear } from './offlineDb'

// Solo estos registros se pueden guardar sin internet (crear). Editar y borrar necesitan conexión.
const QUEUEABLE_PATHS = ['/expenses', '/income', '/applications', '/household']
// Todo lo que se consulta (cultivos, gastos, ventas, reportes, calendario, mercado...) se guarda para verlo
// sin internet, MENOS lo que nunca debe quedar guardado: sesión, miembros, asistentes de IA y archivos.
const NEVER_CACHE_PREFIXES = ['/auth', '/members', '/ai', '/agro', '/asesor', '/agronomo', '/uploads', '/chat']
const MAX_CACHE_BYTES = 1.5 * 1024 * 1024
const MAX_CACHE_ENTRIES = 400
// Si no hay una copia con exactamente los mismos filtros, se usa la que tenga el mismo contenido sin paginación
const PAGING_KEYS = ['page', 'limit', 'skip', 'offset', 'sort', 'order', 'sortBy']

export const QUEUE_TIMEOUT_MS = 20000

const pathOf = (config) => String(config?.url || '').split('?')[0].replace(/\/+$/, '')

export const isQueueable = (config) =>
  String(config?.method || '').toLowerCase() === 'post' && QUEUEABLE_PATHS.includes(pathOf(config))

export const isCacheable = (config) => {
  if (String(config?.method || 'get').toLowerCase() !== 'get') return false
  const p = pathOf(config)
  if (!p) return false
  return !NEVER_CACHE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))
}

export const newKey = () => {
  try { if (crypto?.randomUUID) return crypto.randomUUID() } catch { /* sigue */ }
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`
}

export const currentUserId = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null')?._id || null } catch { return null }
}

// ── Avisos a la pantalla ─────────────────────────────────────────────────────
const listeners = new Set()
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
const notify = () => listeners.forEach((fn) => { try { fn() } catch { /* un oyente roto no afecta a los demás */ } })
export { notify as notifyQueueChanged }

// ── Cola de registros pendientes ─────────────────────────────────────────────
export const listQueue = async () => {
  try {
    const uid = currentUserId()
    const all = await dbGetAll('queue')
    return all.filter((i) => i.userId === uid).sort((a, b) => a.createdAt - b.createdAt)
  } catch { return [] }
}

// Marca de tiempo siempre creciente: dos registros guardados en el mismo instante conservan su orden
let lastStamp = 0
const nextStamp = () => { lastStamp = Math.max(Date.now(), lastStamp + 1); return lastStamp }

export const enqueueFromConfig = async (config) => {
  const uid = currentUserId()
  if (!uid) throw new Error('Sin sesión')
  const key = config.headers?.['Idempotency-Key'] || config.headers?.get?.('Idempotency-Key') || newKey()
  let body = config.data
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { /* se guarda como texto */ } }
  const item = {
    id: key, userId: uid, url: pathOf(config), body,
    createdAt: nextStamp(), status: 'pending', attempts: 0, error: null,
  }
  await dbPut('queue', item)
  notify()
  return item
}

export const updateQueueItem = async (id, patch) => {
  const item = await dbGet('queue', id)
  if (!item) return
  await dbPut('queue', { ...item, ...patch })
  notify()
}

export const removeQueueItem = async (id) => { await dbDelete('queue', id); notify() }

// ── Caché de lecturas ────────────────────────────────────────────────────────
const cacheKeyOf = (config, loose = false) => {
  // Los filtros pueden venir en "params" o escritos en la propia dirección (?scope=active): ambos cuentan
  const entries = []
  const q = String(config?.url || '').split('?')[1]
  if (q) new URLSearchParams(q).forEach((v, k) => entries.push([k, v]))
  if (config.params && typeof config.params === 'object') {
    Object.entries(config.params).forEach(([k, v]) => { if (v !== undefined && v !== null) entries.push([k, String(v)]) })
  }
  const clean = entries.filter(([k, v]) => v !== '' && !(loose && PAGING_KEYS.includes(k))).sort(([a], [b]) => a.localeCompare(b))
  const params = clean.length ? JSON.stringify(clean) : ''
  return `${currentUserId()}|${pathOf(config)}|${params}${loose ? '|loose' : ''}`
}

export const saveCache = async (config, data) => {
  try {
    if (!currentUserId()) return
    const json = JSON.stringify(data)
    if (json.length > MAX_CACHE_BYTES) return
    await dbPut('cache', { key: cacheKeyOf(config), data, savedAt: Date.now() })
    await dbPut('cache', { key: cacheKeyOf(config, true), data, savedAt: Date.now() })
    // De vez en cuando se borran las entradas más viejas para que no crezca sin límite
    if (Math.random() < 0.05) {
      const all = await dbGetAll('cache')
      if (all.length > MAX_CACHE_ENTRIES) {
        all.sort((a, b) => a.savedAt - b.savedAt)
        await Promise.all(all.slice(0, all.length - MAX_CACHE_ENTRIES).map((e) => dbDelete('cache', e.key)))
      }
    }
  } catch { /* sin almacenamiento local: la app sigue funcionando normal */ }
}

export const readCache = async (config) => {
  try {
    if (!currentUserId()) return null
    const entry = (await dbGet('cache', cacheKeyOf(config))) || (await dbGet('cache', cacheKeyOf(config, true)))
    return entry ? entry.data : null
  } catch { return null }
}

// Al cerrar sesión se borran los datos guardados para leer; la cola de pendientes se conserva
// (es de la persona y se sube la próxima vez que entre) para no perder nada.
export const clearCache = async () => { try { await dbClear('cache') } catch { /* nada */ } }