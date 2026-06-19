import { useState } from 'react'
import { useHousehold } from '../hooks/useHousehold'
import HouseholdExpenseForm from '../components/household/HouseholdExpenseForm'
import HouseholdExpenseTable from '../components/household/HouseholdExpenseTable'
import HouseholdSummary from '../components/household/HouseholdSummary'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Tabs from '../components/common/Tabs'
import Pagination from '../components/common/Pagination'
import { HOUSEHOLD_CATEGORIES } from '../utils/constants'
import { formatCurrency } from '../utils/formatCurrency'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'list', label: '📋 Registros' },
  { key: 'summary', label: '📊 Resumen' },
]

export default function HouseholdPage() {
  const { items, total, totalAmount, totalPages, byCategory, byMonth, loading, params, setParams, create, update, remove } = useHousehold()
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const handleSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editing) await update(editing._id, data)
      else await create(data)
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
          <h1 className="page-title">Gastos del hogar 🏠</h1>
          <p className="text-stone-500 text-sm mt-1">
            {total} registro{total !== 1 ? 's' : ''} · Total: <strong className="text-accent-700">{formatCurrency(totalAmount)}</strong>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            onChange={(e) => setParams(p => ({ ...p, category: e.target.value || undefined, page: 1 }))}
            className="border border-stone-200 rounded-full px-4 py-2 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
          >
            <option value="">Todas las categorías</option>
            {HOUSEHOLD_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          <Button onClick={() => { setEditing(null); setShowForm(true) }}>
            + Registrar gasto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab: Lista */}
      {activeTab === 'list' && (
        <>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 overflow-hidden">
            <HouseholdExpenseTable
              items={items}
              loading={loading}
              onEdit={(e) => { setEditing(e); setShowForm(true) }}
              onDelete={(e) => setDeleting(e)}
            />
          </div>
          <Pagination
            page={params.page || 1}
            totalPages={totalPages}
            onPageChange={(p) => setParams(prev => ({ ...prev, page: p }))}
          />
        </>
      )}

      {/* Tab: Resumen */}
      {activeTab === 'summary' && (
        <HouseholdSummary byCategory={byCategory} byMonth={byMonth} totalAmount={totalAmount} />
      )}

      {/* Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Editar gasto' : 'Registrar gasto del hogar'}
        size="lg"
      >
        <HouseholdExpenseForm
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
        title="Eliminar gasto"
        message={`¿Seguro que deseas eliminar "${deleting?.description}"?`}
        loading={formLoading}
      />
    </div>
  )
}
