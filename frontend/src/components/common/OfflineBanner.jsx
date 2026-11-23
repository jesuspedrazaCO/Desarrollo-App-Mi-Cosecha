import { useState, useEffect, useCallback } from 'react'
import { WifiOff, UploadCloud, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
import { listQueue, removeQueueItem, subscribe } from '../../lib/offlineQueue'
import { syncQueue, retryItem, onSyncingChange, isSyncing } from '../../lib/offlineSync'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import Modal from './Modal'
import Button from './Button'

const TYPE_LABELS = {
  '/expenses': 'Gasto',
  '/income': 'Venta',
  '/applications': 'Aplicación',
  '/household': 'Gasto del hogar',
}

const describe = (item) => {
  const b = item.body && typeof item.body === 'object' ? item.body : {}
  const text = b.description || b.concept || b.product || b.productName || b.name || b.title || ''
  const amount = Number(b.amount ?? b.totalAmount)
  let date = ''
  try { if (b.date) date = formatDate(b.date) } catch { /* fecha ilegible: no se muestra */ }
  return { text, amount: Number.isFinite(amount) ? amount : null, date }
}

const bar = 'mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 text-xs'

// Avisa cuando no hay internet y muestra los registros guardados en el celular que esperan subir.
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  const [items, setItems] = useState([])
  const [syncing, setSyncing] = useState(isSyncing())
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const refresh = useCallback(async () => setItems(await listQueue()), [])

  useEffect(() => {
    refresh()
    const unsub = subscribe(refresh)
    const unsubSync = onSyncingChange(setSyncing)
    // Se pide al navegador no borrar estos datos por falta de espacio
    try { navigator.storage?.persist?.() } catch { /* no es obligatorio */ }

    const goOnline = () => { setOnline(true); syncQueue() }
    const goOffline = () => setOnline(false)
    const onVisible = () => { if (document.visibilityState === 'visible') syncQueue() }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    document.addEventListener('visibilitychange', onVisible)
    syncQueue()
    // Mientras haya algo pendiente se reintenta cada 30 segundos
    const timer = setInterval(() => { if (navigator.onLine) syncQueue() }, 30000)

    return () => {
      unsub(); unsubSync(); clearInterval(timer)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const pending = items.filter((i) => i.status === 'pending')
  const failed = items.filter((i) => i.status === 'failed')

  const discard = async (id) => {
    if (confirmId !== id) { setConfirmId(id); return }
    await removeQueueItem(id)
    setConfirmId(null)
  }

  return (
    <>
      {!online && (
        <div role="status" className={bar}
          style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)', color: 'rgba(226,232,240,0.95)' }}>
          <WifiOff size={15} className="flex-shrink-0" />
          <span className="flex-1 min-w-[200px]">
            <strong>Sin conexión.</strong> Puedes seguir registrando gastos, ventas, aplicaciones y gastos del hogar:
            se guardan en tu celular y se suben solos cuando vuelva el internet. Las listas muestran lo último que viste.
          </span>
        </div>
      )}

      {items.length > 0 && (
        <div role="status" className={bar}
          style={{ background: failed.length ? 'rgba(248,113,113,0.12)' : 'rgba(56,189,248,0.12)', border: `1px solid ${failed.length ? 'rgba(248,113,113,0.35)' : 'rgba(56,189,248,0.35)'}`, color: 'rgba(240,249,255,0.95)' }}>
          {failed.length ? <AlertTriangle size={15} className="flex-shrink-0" /> : <UploadCloud size={15} className="flex-shrink-0" />}
          <span className="flex-1 min-w-[200px]">
            {pending.length > 0 && <><strong>{pending.length}</strong> {pending.length === 1 ? 'registro espera' : 'registros esperan'} subir. </>}
            {failed.length > 0 && <><strong>{failed.length}</strong> no se pudo subir, revísalo.</>}
          </span>
          <button type="button" onClick={() => setOpen(true)} className="font-bold underline underline-offset-2">Ver</button>
          {pending.length > 0 && online && (
            <button type="button" onClick={syncQueue} disabled={syncing} className="font-bold underline underline-offset-2 disabled:opacity-50">
              {syncing ? 'Subiendo…' : 'Subir ahora'}
            </button>
          )}
        </div>
      )}

      <Modal isOpen={open} onClose={() => { setOpen(false); setConfirmId(null) }} title="Registros guardados sin internet" size="lg">
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-white/70">No hay nada pendiente. ✅</p>
          ) : (
            <>
              <p className="text-xs text-white/55">
                Estos registros están guardados en tu celular y todavía no están en el servidor.
                No cierres sesión ni borres los datos del navegador hasta que se suban.
              </p>
              <ul className="space-y-2">
                {items.map((item) => {
                  const d = describe(item)
                  return (
                    <li key={item.id} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${item.status === 'failed' ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.14)'}` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white/90 truncate">
                            {TYPE_LABELS[item.url] || 'Registro'}{d.text ? ` · ${d.text}` : ''}
                          </p>
                          <p className="text-[11px] text-white/45">
                            {d.date ? `${d.date} · ` : ''}guardado {new Date(item.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                        {d.amount !== null && <p className="text-sm font-bold text-orange-300 shrink-0">{formatCurrency(d.amount)}</p>}
                      </div>
                      {item.status === 'failed' && <p className="mt-2 text-xs text-red-300">No se pudo subir: {item.error}</p>}
                      <div className="mt-2 flex items-center justify-end gap-2">
                        {item.status === 'failed' && (
                          <button type="button" onClick={() => retryItem(item.id)} className="text-[11px] font-semibold text-primary-300 flex items-center gap-1">
                            <RefreshCw size={12} /> Reintentar
                          </button>
                        )}
                        <button type="button" onClick={() => discard(item.id)}
                          className={`text-[11px] font-semibold flex items-center gap-1 ${confirmId === item.id ? 'text-red-300' : 'text-white/50 hover:text-red-300'}`}>
                          <Trash2 size={12} /> {confirmId === item.id ? 'Toca otra vez para borrarlo' : 'Eliminar'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <div className="flex justify-end gap-2 pt-1">
            {pending.length > 0 && online && <Button type="button" variant="secondary" onClick={syncQueue} loading={syncing}>Subir ahora</Button>}
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}