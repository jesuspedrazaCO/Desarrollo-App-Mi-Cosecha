// Base de datos local del celular (IndexedDB), sin librerías externas.
//  - queue: registros creados sin internet, esperando subir
//  - cache: última respuesta de cada lista, para poder consultarla sin internet
const DB_NAME = 'agrofinanzas-offline'
const DB_VERSION = 1
let dbPromise = null

const open = () => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB no disponible'))
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => { dbPromise = null; reject(req.error) }
  })
  return dbPromise
}

const run = async (store, mode, fn) => {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const request = fn(t.objectStore(store))
    let result
    if (request) request.onsuccess = () => { result = request.result }
    t.oncomplete = () => resolve(result)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

export const dbGetAll = (store) => run(store, 'readonly', (s) => s.getAll())
export const dbGet = (store, key) => run(store, 'readonly', (s) => s.get(key))
export const dbPut = (store, value) => run(store, 'readwrite', (s) => s.put(value))
export const dbDelete = (store, key) => run(store, 'readwrite', (s) => s.delete(key))
export const dbClear = (store) => run(store, 'readwrite', (s) => s.clear())