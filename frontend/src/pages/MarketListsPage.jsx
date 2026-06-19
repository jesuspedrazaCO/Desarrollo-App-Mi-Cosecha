import { useState } from 'react'
import { useMarketLists } from '../hooks/useMarketLists'
import MarketListCard from '../components/market/MarketListCard'
import MarketListForm from '../components/market/MarketListForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import toast from 'react-hot-toast'

export default function MarketListsPage() {
  const { lists, loading, createList, updateList, removeList } = useMarketLists()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const handleSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editing) await updateList(editing._id, data)
      else await createList(data)
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      await removeList(deleting._id)
      setDeleting(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Lista de mercado 🛒</h1>
          <p className="text-stone-500 text-sm mt-1">{lists.length} lista{lists.length !== 1 ? 's' : ''} guardadas</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          + Nueva lista
        </Button>
      </div>

      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : lists.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="No tienes listas de mercado"
          description="Crea una lista para organizar tus compras y llevar el control del presupuesto"
          action={<Button onClick={() => setShowForm(true)}>+ Crear primera lista</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {lists.map(list => (
            <MarketListCard
              key={list._id}
              list={list}
              onEdit={(l) => { setEditing(l); setShowForm(true) }}
              onDelete={(l) => setDeleting(l)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Editar lista' : 'Nueva lista de mercado'}
      >
        <MarketListForm
          defaultValues={editing}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null) }}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar lista"
        message={`¿Eliminar "${deleting?.name}" y todos sus productos?`}
        loading={formLoading}
      />
    </div>
  )
}
