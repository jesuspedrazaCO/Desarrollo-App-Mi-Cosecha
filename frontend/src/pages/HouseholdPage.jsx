import { useState } from 'react'
import { useHousehold } from '../hooks/useHousehold'
import { useAuth } from '../hooks/useAuth'
import HouseholdExpenseForm from '../components/household/HouseholdExpenseForm'
import HouseholdExpenseTable from '../components/household/HouseholdExpenseTable'
import HouseholdSummary from '../components/household/HouseholdSummary'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Tabs from '../components/common/Tabs'
import Pagination from '../components/common/Pagination'
import ExportPDFButton from '../components/common/ExportPDFButton'
import { HOUSEHOLD_CATEGORIES } from '../utils/constants'
import { formatCurrency } from '../utils/formatCurrency'
import { exportHouseholdReport } from '../utils/pdfExport'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'list', label: '📋 Registros' },
  { key: 'summary', label: '📊 Resumen' },
]

export default function HouseholdPage() {
  const { items, total, totalAmount, totalPages, byCategory, byMonth, loading, params, setParams, create, update, remove } = useHousehold()
  const { user } = useAuth()
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
    try { await remove(deleting._id); setDeleting(null) }
    catch (err) { toast.error(err.response?.data?.message || 'Error al eliminar') }
    finally { setFormLoading(false) }
  }

  const handleExportPDF = () => {
    if (items.length === 0) {
      toast.error('No hay registros para exportar')
      return
    }
    exportHouseholdReport(items, totalAmount, user)
    toast.success('PDF generado correctamente')
  }

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Gastos del hogar 🏠</h1>
          <p className="text-white/50 text-sm mt-1">
            {total} registro{total !== 1 ? 's' : ''} · Total: <strong className="text-orange-300">{formatCurrency(totalAmount)}</strong>
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <select
            onChange={(e) => setParams(p => ({ ...p, category: e.target.value || undefined, page: 1 }))}
            className="border rounded-full px-4 py-2 text-sm"
            style={{ background: 'rgba(255,255,255,0.85)', color: '#1c1917', borderColor: 'rgba(200,200,200,0.5)' }}
          >
            <option value="">Todas las categorías</option>
            {HOUSEHOLD_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          <ExportPDFButton onExport={handleExportPDF} label="Exportar" size="sm" />
          <Button onClick={() => { setEditing(null); setShowForm(true) }}>+ Registrar gasto</Button>
        </div>
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'list' && (
        <>
          <div className="rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <HouseholdExpenseTable items={items} loading={loading}
              onEdit={(e) => { setEditing(e); setShowForm(true) }}
              onDelete={(e) => setDeleting(e)} />
          </div>
          <Pagination page={params.page || 1} totalPages={totalPages} onPageChange={(p) => setParams(prev => ({ ...prev, page: p }))} />
        </>
      )}

      {activeTab === 'summary' && (
        <HouseholdSummary byCategory={byCategory} byMonth={byMonth} totalAmount={totalAmount} />
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Editar gasto' : 'Registrar gasto del hogar'} size="lg">
        <HouseholdExpenseForm defaultValues={editing} onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditing(null) }} loading={formLoading} />
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={handleDelete} title="Eliminar gasto"
        message={`¿Seguro que deseas eliminar "${deleting?.description}"?`} loading={formLoading} />
    </div>
  )
}
