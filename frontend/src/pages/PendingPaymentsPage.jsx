import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import {
  getPendingExpenses, createPendingOrder, payExpense, payOrder,
} from '../services/expenseService'
import { getCrops } from '../services/cropService'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../utils/constants'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate, toInputDate } from '../utils/formatDate'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'

const fieldStyle = {
  backgroundColor: 'rgba(255,255,255,0.88)', color: '#1c1917',
  border: '1px solid rgba(200,200,200,0.55)', borderRadius: '14px',
  padding: '10px 14px', fontSize: '14px', fontWeight: 500, width: '100%', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
}

const emptyItem = (crop = '') => ({ description: '', category: 'otros', amount: '', crop })
const todayInput = () => toInputDate(new Date())
const catInfo = (v) => EXPENSE_CATEGORIES.find((c) => c.value === v) || { label: v, icon: '📦' }

// Agrupa los gastos por compra (orderId); los que no tienen compra quedan sueltos
const groupOrders = (expenses) => {
  const map = new Map()
  expenses.forEach((e) => {
    const key = e.orderId || e._id
    if (!map.has(key)) map.set(key, { key, orderId: e.orderId, supplier: e.supplier, date: e.date, dueDate: e.dueDate, items: [] })
    map.get(key).items.push(e)
  })
  return [...map.values()]
}

export default function PendingPaymentsPage() {
  const [data, setData] = useState({ expenses: [], totalAmount: 0, overdueCount: 0 })
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [paying, setPaying] = useState(null) // { orderId?, expense?, total, label }

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([getPendingExpenses(), getCrops({ limit: 100 })])
      setData(p.data)
      setCrops(c.data.crops || c.data || [])
    } catch {
      toast.error('Error al cargar los pendientes')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const orders = useMemo(() => groupOrders(data.expenses), [data.expenses])
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isOverdue = (d) => d && new Date(d) < today

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white font-display">Pendientes por pagar</h1>
          <p className="text-xs text-white/45 mt-0.5">Lo que ya compraste y todavía no pagas. Cuenta como gasto desde ya; al pagar queda un recibo en Comprobantes.</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Registrar compra</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-[11px] text-white/45 font-semibold">Total por pagar</p>
          <p className="text-xl font-bold text-orange-300 mt-1">{formatCurrency(data.totalAmount)}</p>
        </div>
        <div className="rounded-3xl p-4" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p className="text-[11px] text-white/45 font-semibold">Vencidos</p>
          <p className={`text-xl font-bold mt-1 ${data.overdueCount ? 'text-red-300' : 'text-white/80'}`}>{data.overdueCount}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="✅" title="No debes nada" description="Cuando compres algo sin pagarlo, regístralo aquí para no olvidarlo." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 items-start">
          {orders.map((o) => (
            <OrderCard key={o.key} o={o} late={isOverdue(o.dueDate)} onPay={setPaying} />
          ))}
        </div>
      )}

      <OrderModal isOpen={showForm} onClose={() => setShowForm(false)} crops={crops}
        onSaved={() => { setShowForm(false); load() }} />
      <PayModal paying={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); load() }} />
    </div>
  )
}

const COLLAPSED = 2

function OrderCard({ o, late, onPay }) {
  const [open, setOpen] = useState(false)
  const total = o.items.reduce((s, i) => s + i.amount, 0)
  const visible = open ? o.items : o.items.slice(0, COLLAPSED)
  const hidden = o.items.length - COLLAPSED
  return (
    <div className="rounded-2xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.09)', border: `1px solid ${late ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.14)'}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/90 truncate">{o.supplier || 'Sin proveedor'}</p>
          <p className="text-[11px] text-white/45">Compra del {formatDate(o.date)} · {o.items.length} {o.items.length === 1 ? 'producto' : 'productos'}</p>
        </div>
        <p className="text-base font-bold text-orange-300 shrink-0">{formatCurrency(total)}</p>
      </div>
      <Badge color={late ? 'red' : 'amber'}>
        {late ? <AlertTriangle size={11} /> : <Clock size={11} />}
        {o.dueDate ? `${late ? 'Venció' : 'Vence'} ${formatDate(o.dueDate)}` : 'Por pagar'}
      </Badge>

      <ul className="divide-y divide-white/10">
        {visible.map((i) => (
          <li key={i._id} className="py-1.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] text-white/85 truncate">{catInfo(i.category).icon} {i.description}</p>
              <p className="text-[10px] text-white/40 truncate">
                {i.crop ? <>Cultivo: <Link to={`/crops/${i.crop._id}`} className="text-primary-300 hover:underline">{i.crop.name}</Link></> : 'Gasto general (sin cultivo)'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[13px] font-semibold text-white/80">{formatCurrency(i.amount)}</span>
              {o.items.length > 1 && (
                <button className="text-[11px] font-semibold text-primary-300 hover:text-primary-200"
                  onClick={() => onPay({ expense: i, total: i.amount, label: i.description })}>Pagar</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button className="text-[11px] font-semibold text-white/55 hover:text-white" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ver menos' : `Ver ${hidden} más`}
        </button>
      )}

      <Button size="sm" className="w-full"
        onClick={() => onPay(o.orderId
          ? { orderId: o.orderId, total, label: o.supplier || 'esta compra' }
          : { expense: o.items[0], total, label: o.items[0].description })}>
        <CheckCircle2 size={14} /> Marcar {o.items.length > 1 ? 'toda la compra ' : ''}como pagada
      </Button>
    </div>
  )
}

function OrderModal({ isOpen, onClose, crops, onSaved }) {
  const [supplier, setSupplier] = useState('')
  const [date, setDate] = useState(todayInput())
  const [dueDate, setDueDate] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSupplier(''); setDate(todayInput()); setDueDate('')
      setItems([emptyItem(crops.length === 1 ? crops[0]._id : '')])
    }
  }, [isOpen, crops])

  const setItem = (idx, patch) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    if (items.some((i) => !i.description.trim())) return toast.error('Escribe qué compraste en cada línea')
    if (items.some((i) => !(Number(i.amount) > 0))) return toast.error('El valor de cada producto debe ser mayor a 0')
    setSaving(true)
    try {
      await createPendingOrder({
        supplier: supplier.trim(), date, dueDate: dueDate || undefined,
        items: items.map((i) => ({ ...i, description: i.description.trim(), amount: Number(i.amount) })),
      })
      toast.success('Compra registrada como pendiente')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar compra por pagar" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label style={labelStyle}>¿A quién le debes?</label>
          <input style={fieldStyle} value={supplier} maxLength={100} placeholder="Ferretería, almacén agrícola..." onChange={(e) => setSupplier(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label style={labelStyle}>Fecha de compra</label>
            <input type="date" style={fieldStyle} value={date} required onChange={(e) => setDate(e.target.value)} /></div>
          <div><label style={labelStyle}>Pagar antes del</label>
            <input type="date" style={fieldStyle} value={dueDate} min={date} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>

        <div className="space-y-3">
          <p style={labelStyle}>Productos</p>
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex gap-2">
                <input style={fieldStyle} placeholder="Ej: 4 rollos de manguera" value={it.description} maxLength={200}
                  onChange={(e) => setItem(idx, { description: e.target.value })} />
                {items.length > 1 && (
                  <button type="button" aria-label="Quitar producto" className="text-red-300 hover:text-red-200 px-1"
                    onClick={() => setItems((a) => a.filter((_, i) => i !== idx))}><Trash2 size={17} /></button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select style={fieldStyle} value={it.crop} onChange={(e) => setItem(idx, { crop: e.target.value })}>
                  <option value="">Sin cultivo (gasto general)</option>
                  {crops.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <select style={fieldStyle} value={it.category} onChange={(e) => setItem(idx, { category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
                <input type="number" inputMode="numeric" min="1" step="any" style={fieldStyle} placeholder="Valor $" value={it.amount}
                  onChange={(e) => setItem(idx, { amount: e.target.value })} />
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm"
            onClick={() => setItems((a) => [...a, emptyItem(a[a.length - 1]?.crop || '')])}><Plus size={14} /> Agregar otro producto</Button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-white/60">Total: <strong className="text-orange-300">{formatCurrency(total)}</strong></p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function PayModal({ paying, onClose, onDone }) {
  const [paidAt, setPaidAt] = useState(todayInput())
  const [method, setMethod] = useState('efectivo')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (paying) { setPaidAt(todayInput()); setMethod('efectivo') } }, [paying])

  const confirm = async () => {
    setSaving(true)
    try {
      const body = { paidAt, paymentMethod: method }
      if (paying.orderId) await payOrder(paying.orderId, body)
      else await payExpense(paying.expense._id, body)
      toast.success('Marcado como pagado')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={!!paying} onClose={onClose} title="Marcar como pagado" size="sm">
      {paying && (
        <div className="space-y-4">
          <p className="text-sm text-white/70">
            {paying.label}: <strong className="text-orange-300">{formatCurrency(paying.total)}</strong>.
            Saldrá de pendientes, quedará como gasto (en su cultivo, si tiene) sin la etiqueta, y se guardará un recibo en Comprobantes.
          </p>
          <div><label style={labelStyle}>Fecha de pago</label>
            <input type="date" style={fieldStyle} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></div>
          <div><label style={labelStyle}>Pagado con</label>
            <select style={fieldStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.filter((m) => m.value !== 'credito').map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select></div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={confirm} loading={saving}>Confirmar pago</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
