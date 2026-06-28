import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getMarketListById, addMarketItem, updateMarketItem,
  deleteMarketItem, updateMarketList
} from '../services/marketService'
import MarketItemForm from '../components/market/MarketItemForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import Badge from '../components/common/Badge'
import { formatDate } from '../utils/formatDate'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'

export default function MarketListDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await getMarketListById(id)
      setData(res.data)
    } catch {
      toast.error('Error al cargar la lista')
      navigate('/market')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddItem = async (formData) => {
    setFormLoading(true)
    try {
      if (editingItem) {
        await updateMarketItem(editingItem._id, formData)
        toast.success('Producto actualizado')
      } else {
        await addMarketItem(id, formData)
        toast.success('Producto agregado')
      }
      setShowItemForm(false)
      setEditingItem(null)
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    setFormLoading(true)
    try {
      await deleteMarketItem(deletingItem._id)
      toast.success('Producto eliminado')
      setDeletingItem(null)
      await fetchData()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  // Toggle comprado — llama fetchData() después para refrescar UI
  const handleToggle = async (itemId, purchased) => {
    try {
      await updateMarketItem(itemId, { purchased })
      await fetchData() // <-- CRÍTICO: refresca la lista completa
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleMarkComplete = async () => {
    try {
      await updateMarketList(id, { status: 'completada' })
      toast.success('Lista marcada como completada')
      await fetchData()
    } catch {
      toast.error('Error al actualizar la lista')
    }
  }

  if (loading) return <Spinner size="lg" className="mt-20" />

  const { list, items = [], totalEstimated } = data || {}
  const purchasedCount = items.filter(i => i.purchased).length
  const pct = items.length > 0 ? Math.round((purchasedCount / items.length) * 100) : 0
  const totalPurchased = items
    .filter(i => i.purchased)
    .reduce((sum, i) => sum + (i.quantity * (i.estimatedPrice || 0)), 0)

  // Pendientes primero, comprados al final
  const sortedItems = [
    ...items.filter(i => !i.purchased),
    ...items.filter(i => i.purchased),
  ]

  return (
    <div className="space-y-5 animate-float-up max-w-3xl">
      <button onClick={() => navigate('/market')}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: 'rgba(255,255,255,0.55)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
      >
        ← Volver a mis listas
      </button>

      {/* Header */}
      <div className="rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', boxShadow: '0 4px 16px rgba(234,88,12,0.4)' }}>
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-bold text-white font-display">{list?.name}</h1>
                <Badge color={list?.status === 'completada' ? 'green' : 'amber'}>
                  {list?.status === 'completada' ? '✅ Completada' : '⏳ Pendiente'}
                </Badge>
              </div>
              <p className="text-xs text-white/45 mt-1">{formatDate(list?.date)}</p>
            </div>
          </div>
          {list?.status !== 'completada' && (
            <Button variant="secondary" size="sm" onClick={handleMarkComplete}>
              ✅ Marcar completada
            </Button>
          )}
        </div>

        {/* Progreso */}
        {items.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <span>{purchasedCount} de {items.length} productos comprados</span>
              <span className="font-bold" style={{ color: pct === 100 ? '#4ade80' : 'rgba(255,255,255,0.75)' }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct === 100
                    ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                    : 'linear-gradient(90deg, #258a4e, #4ade80)',
                }}
              />
            </div>
          </div>
        )}

        {/* Totales — texto oscuro sobre fondo claro */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.5)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#6b7280' }}>Total estimado</p>
            <p className="text-lg font-bold font-display" style={{ color: '#b45309' }}>{formatCurrency(totalEstimated || 0)}</p>
          </div>
          <div className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(220,252,231,0.90)', border: '1px solid rgba(74,222,128,0.35)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#15803d' }}>Ya comprado</p>
            <p className="text-lg font-bold font-display" style={{ color: '#166534' }}>{formatCurrency(totalPurchased)}</p>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.14)' }}>
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
          <h3 className="text-[15px] font-bold text-white">Productos ({items.length})</h3>
          <Button size="sm" onClick={() => { setEditingItem(null); setShowItemForm(true) }}>
            + Agregar
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Lista vacía"
            description="Agrega los productos que necesitas comprar"
            action={<Button size="sm" onClick={() => setShowItemForm(true)}>+ Agregar producto</Button>}
          />
        ) : (
          <div>
            {sortedItems.map(item => (
              <div
                key={item._id}
                className="flex items-center gap-3 px-5 py-3.5 transition-all duration-200"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  opacity: item.purchased ? 0.6 : 1,
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(item._id, !item.purchased)}
                  className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                  style={{
                    borderColor: item.purchased ? '#16a34a' : 'rgba(255,255,255,0.40)',
                    background: item.purchased ? '#16a34a' : 'transparent',
                  }}
                >
                  {item.purchased && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Nombre */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold"
                    style={{
                      color: item.purchased ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.90)',
                      textDecoration: item.purchased ? 'line-through' : 'none',
                    }}>
                    {item.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {item.quantity} {item.unit}
                    {item.estimatedPrice > 0 && ` · ${formatCurrency(item.estimatedPrice)} c/u`}
                  </p>
                </div>

                {/* Subtotal */}
                {item.estimatedPrice > 0 && (
                  <span className="text-sm font-bold flex-shrink-0"
                    style={{ color: item.purchased ? '#4ade80' : 'rgba(255,255,255,0.85)' }}>
                    {formatCurrency(item.quantity * item.estimatedPrice)}
                  </span>
                )}

                {/* Acciones */}
                <div className="flex gap-1">
                  <button onClick={() => { setEditingItem(item); setShowItemForm(true) }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>✏️</button>
                  <button onClick={() => setDeletingItem(item)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all"
                    style={{ color: 'rgba(255,255,255,0.50)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showItemForm} onClose={() => { setShowItemForm(false); setEditingItem(null) }}
        title={editingItem ? 'Editar producto' : 'Agregar producto'}>
        <MarketItemForm
          defaultValues={editingItem}
          onSubmit={handleAddItem}
          onCancel={() => { setShowItemForm(false); setEditingItem(null) }}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog isOpen={!!deletingItem} onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteItem} title="Eliminar producto"
        message={`¿Eliminar "${deletingItem?.name}" de la lista?`} loading={formLoading} />
    </div>
  )
}
