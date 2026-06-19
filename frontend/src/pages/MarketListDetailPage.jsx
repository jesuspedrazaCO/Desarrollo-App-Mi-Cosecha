import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMarketListById, addMarketItem, updateMarketItem, deleteMarketItem, updateMarketList } from '../services/marketService'
import MarketItemRow from '../components/market/MarketItemRow'
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
      fetchData()
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
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggle = async (itemId, purchased) => {
    try {
      await updateMarketItem(itemId, { purchased })
      fetchData()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const handleMarkComplete = async () => {
    try {
      await updateMarketList(id, { status: 'completada' })
      toast.success('Lista marcada como completada')
      fetchData()
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
    .reduce((sum, i) => sum + (i.quantity * i.estimatedPrice), 0)

  return (
    <div className="space-y-5 animate-float-up max-w-3xl">
      {/* Volver */}
      <button onClick={() => navigate('/market')}
        className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-primary-600 transition-colors">
        ← Volver a mis listas
      </button>

      {/* Header de la lista */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-2xl shadow-soft w-14 h-14">
              🛒
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="page-title !text-[20px]">{list?.name}</h1>
                <Badge color={list?.status === 'completada' ? 'green' : 'amber'}>
                  {list?.status === 'completada' ? '✅ Completada' : '⏳ Pendiente'}
                </Badge>
              </div>
              <p className="text-xs text-stone-400 mt-1">{formatDate(list?.date)}</p>
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
            <div className="flex justify-between text-xs text-stone-500 mb-2">
              <span>{purchasedCount} de {items.length} productos comprados</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Totales */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-stone-50/70 rounded-2xl px-4 py-3">
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total estimado</p>
            <p className="text-lg font-bold text-accent-700 font-display">{formatCurrency(totalEstimated)}</p>
          </div>
          <div className="bg-primary-50/70 rounded-2xl px-4 py-3">
            <p className="text-[10px] text-primary-500 font-bold uppercase tracking-wider">Ya comprado</p>
            <p className="text-lg font-bold text-primary-700 font-display">{formatCurrency(totalPurchased)}</p>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="section-title">Productos ({items.length})</h3>
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
            {/* Pendientes primero */}
            {items.filter(i => !i.purchased).map(item => (
              <MarketItemRow
                key={item._id}
                item={item}
                onEdit={(i) => { setEditingItem(i); setShowItemForm(true) }}
                onDelete={(i) => setDeletingItem(i)}
                onToggle={handleToggle}
              />
            ))}
            {/* Comprados al final */}
            {items.filter(i => i.purchased).map(item => (
              <MarketItemRow
                key={item._id}
                item={item}
                onEdit={(i) => { setEditingItem(i); setShowItemForm(true) }}
                onDelete={(i) => setDeletingItem(i)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal item */}
      <Modal
        isOpen={showItemForm}
        onClose={() => { setShowItemForm(false); setEditingItem(null) }}
        title={editingItem ? 'Editar producto' : 'Agregar producto'}
      >
        <MarketItemForm
          defaultValues={editingItem}
          onSubmit={handleAddItem}
          onCancel={() => { setShowItemForm(false); setEditingItem(null) }}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteItem}
        title="Eliminar producto"
        message={`¿Eliminar "${deletingItem?.name}" de la lista?`}
        loading={formLoading}
      />
    </div>
  )
}
