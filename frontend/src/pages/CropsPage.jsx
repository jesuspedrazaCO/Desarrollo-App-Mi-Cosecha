import { useState } from 'react'
import { useCrops } from '../hooks/useCrops'
import CropCard from '../components/crops/CropCard'
import CropForm from '../components/crops/CropForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import SearchBar from '../components/common/SearchBar'
import Spinner from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import Tabs from '../components/common/Tabs'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { key: '', label: 'Todos' },
  { key: 'activo', label: '🌱 Activos' },
  { key: 'finalizado', label: '✅ Finalizados' },
  { key: 'suspendido', label: '⏸️ Suspendidos' },
]

export default function CropsPage() {
  const { crops, loading, params, setParams, create, update, remove } = useCrops()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [search, setSearch] = useState('')

  const handleSearch = (val) => {
    setSearch(val)
    setParams(p => ({ ...p, search: val }))
  }

  const handleStatusFilter = (val) => {
    setParams(p => ({ ...p, status: val || undefined }))
  }

  const handleSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editing) await update(editing._id, data)
      else await create(data)
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el cultivo')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setFormLoading(true)
    try {
      await remove(deleting._id)
      setDeleting(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-float-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Mis cultivos 🌱</h1>
          <p className="text-stone-500 text-sm mt-1">{crops.length} cultivo{crops.length !== 1 ? 's' : ''} registrados</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}>
          + Registrar cultivo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por nombre, tipo o ubicación..."
          className="w-full sm:max-w-xs"
        />
        <Tabs
          tabs={STATUS_TABS}
          active={params.status || ''}
          onChange={handleStatusFilter}
        />
      </div>

      {/* Grid de cultivos */}
      {loading ? (
        <Spinner size="lg" className="mt-16" />
      ) : crops.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="Aún no tienes cultivos"
          description="Registra tu primer cultivo para empezar a llevar el control de gastos, ingresos y ganancias."
          action={<Button onClick={() => setShowForm(true)}>+ Registrar primer cultivo</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {crops.map(crop => (
            <CropCard
              key={crop._id}
              crop={crop}
              onEdit={(c) => { setEditing(c); setShowForm(true) }}
              onDelete={(c) => setDeleting(c)}
            />
          ))}
        </div>
      )}

      {/* Modal formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Editar cultivo' : 'Registrar cultivo'}
        size="lg"
      >
        <CropForm
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
        title="Eliminar cultivo"
        message={`¿Eliminar "${deleting?.name}"? También se borrarán todos sus gastos e ingresos. Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </div>
  )
}
