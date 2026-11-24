import api from '../services/api'

// Con internet, descarga en segundo plano lo principal de la finca para poder verlo sin conexión
// (cultivos, gastos, ventas, aplicaciones, hogar, reportes y el resumen). Cada respuesta queda guardada
// por el interceptor de api.js; aquí solo se piden. Máximo una vez cada 10 minutos.
let running = false
let lastRun = 0
const EVERY_MS = 10 * 60 * 1000

const quiet = (p) => p.catch(() => null)

export async function warmCache(force = false) {
  if (running || !navigator.onLine || !localStorage.getItem('token')) return
  if (!force && Date.now() - lastRun < EVERY_MS) return
  running = true
  try {
    const cropsRes = await quiet(api.get('/crops'))
    await Promise.all([
      quiet(api.get('/expenses')),
      quiet(api.get('/expenses/pending')),
      quiet(api.get('/income')),
      quiet(api.get('/applications')),
      quiet(api.get('/household')),
      quiet(api.get('/dashboard/stats', { params: { scope: 'active' } })),
      quiet(api.get('/dashboard/stats', { params: { scope: 'all' } })),
      quiet(api.get('/reports/crops-comparison')),
      quiet(api.get('/reports/agro-expenses')),
    ])
    // Detalle de cada cultivo (hasta 30, de uno en uno para no saturar el celular)
    const list = Array.isArray(cropsRes?.data) ? cropsRes.data : (cropsRes?.data?.crops || [])
    for (const crop of list.slice(0, 30)) {
      if (!navigator.onLine) break
      if (crop?._id) await quiet(api.get(`/crops/${crop._id}`))
    }
    lastRun = Date.now()
  } finally {
    running = false
  }
}