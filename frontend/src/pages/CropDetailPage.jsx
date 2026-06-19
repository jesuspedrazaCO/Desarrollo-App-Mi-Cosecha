import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCropById } from '../services/cropService'
import { useExpenses } from '../hooks/useExpenses'
import { useIncome } from '../hooks/useIncome'
import CropFinancialSummary from '../components/crops/CropFinancialSummary'
import ExpenseTable from '../components/expenses/ExpenseTable'
import ExpenseForm from '../components/expenses/ExpenseForm'
import IncomeTable from '../components/income/IncomeTable'
import IncomeForm from '../components/income/IncomeForm'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import Tabs from '../components/common/Tabs'
import Badge from '../components/common/Badge'
import { CROP_STATUS } from '../utils/constants'
import { formatDate, toInputDate } from '../utils/formatDate'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'summary', label: '📊 Resumen' },
  { key: 'expenses', label: '💰 Gastos' },
  { key: 'income', label: '📈 Ingresos' },
]

export default function CropDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cropData, setCropData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingIncome, setEditingIncome] = useState(null)
  const [deletingExpense, setDeletingExpense] = useState(null)
  const [deletingIncome, setDeletingIncome] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const { expenses, totalAmount: totalExpenses, loading: loadingExpenses,
    create: createExpense, update: updateExpense, remove: removeExpense } =
    useExpenses({ crop: id, limit: 50 })

  const { incomes, totalAmount: totalIncomes, loading: loadingIncomes,
    create: createIncome, update: updateIncome, remove: removeIncome } =
    useIncome({ crop: id, limit: 50 })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getCropById(id)
        setCropData(res.data)
      } catch {
        toast.error('Error al cargar el cultivo')
        navigate('/crops')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleExpenseSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editingExpense) await updateExpense(editingExpense._id, data)
      else await createExpense(data)
      setShowExpenseForm(false)
      setEditingExpense(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el gasto')
    } finally {
      setFormLoading(false)
    }
  }

  const handleIncomeSubmit = async (data) => {
    setFormLoading(true)
    try {
      if (editingIncome) await updateIncome(editingIncome._id, data)
      else await createIncome(data)
      setShowIncomeForm(false)
      setEditingIncome(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar el ingreso')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteExpense = async () => {
    setFormLoading(true)
    try {
      await removeExpense(deletingExpense._id)
      setDeletingExpense(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteIncome = async () => {
    setFormLoading(true)
    try {
      await removeIncome(deletingIncome._id)
      setDeletingIncome(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) return <Spinner size="lg" className="mt-20" />

  const { crop, summary } = cropData || {}
  const status = CROP_STATUS[crop?.status] || CROP_STATUS.activo

  return (
    <div className="space-y-5 animate-float-up max-w-5xl">
      {/* Volver */}
      <button onClick={() => navigate('/crops')}
        className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-primary-600 transition-colors">
        ← Volver a cultivos
      </button>

      {/* Header del cultivo */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-3xl shadow-soft">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="page-title !text-[22px]">{crop?.name}</h1>
                <Badge color={status.color}>{status.label}</Badge>
              </div>
              <p className="text-stone-500 text-sm">{crop?.type} {crop?.location && `· ${crop.location}`}</p>
              {crop?.startDate && (
                <p className="text-xs text-stone-400 mt-1">
                  Inicio: {formatDate(crop.startDate)}
                  {crop?.estimatedHarvestDate && ` · Cosecha estimada: ${formatDate(crop.estimatedHarvestDate)}`}
                </p>
              )}
            </div>
          </div>
          {crop?.observations && (
            <p className="text-sm text-stone-500 bg-stone-50 rounded-2xl px-4 py-2 max-w-sm">
              {crop.observations}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab: Resumen */}
      {activeTab === 'summary' && (
        <CropFinancialSummary
          summary={summary}
          expenses={expenses}
        />
      )}

      {/* Tab: Gastos */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-title">Gastos del cultivo</h3>
              <p className="text-xs text-stone-400 mt-0.5">Total: <strong className="text-accent-700">${totalExpenses?.toLocaleString('es-CO')}</strong></p>
            </div>
            <Button size="sm" onClick={() => { setEditingExpense(null); setShowExpenseForm(true) }}>
              + Registrar gasto
            </Button>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 overflow-hidden">
            <ExpenseTable
              expenses={expenses}
              loading={loadingExpenses}
              onEdit={(e) => { setEditingExpense(e); setShowExpenseForm(true) }}
              onDelete={(e) => setDeletingExpense(e)}
            />
          </div>
        </div>
      )}

      {/* Tab: Ingresos */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="section-title">Ingresos del cultivo</h3>
              <p className="text-xs text-stone-400 mt-0.5">Total: <strong className="text-primary-700">${totalIncomes?.toLocaleString('es-CO')}</strong></p>
            </div>
            <Button size="sm" onClick={() => { setEditingIncome(null); setShowIncomeForm(true) }}>
              + Registrar ingreso
            </Button>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 overflow-hidden">
            <IncomeTable
              incomes={incomes}
              loading={loadingIncomes}
              onEdit={(i) => { setEditingIncome(i); setShowIncomeForm(true) }}
              onDelete={(i) => setDeletingIncome(i)}
            />
          </div>
        </div>
      )}

      {/* Modales */}
      <Modal isOpen={showExpenseForm} onClose={() => { setShowExpenseForm(false); setEditingExpense(null) }}
        title={editingExpense ? 'Editar gasto' : 'Registrar gasto'} size="lg">
        <ExpenseForm
          defaultValues={editingExpense}
          cropId={id}
          onSubmit={handleExpenseSubmit}
          onCancel={() => { setShowExpenseForm(false); setEditingExpense(null) }}
          loading={formLoading}
        />
      </Modal>

      <Modal isOpen={showIncomeForm} onClose={() => { setShowIncomeForm(false); setEditingIncome(null) }}
        title={editingIncome ? 'Editar ingreso' : 'Registrar ingreso'} size="lg">
        <IncomeForm
          defaultValues={editingIncome}
          cropId={id}
          onSubmit={handleIncomeSubmit}
          onCancel={() => { setShowIncomeForm(false); setEditingIncome(null) }}
          loading={formLoading}
        />
      </Modal>

      <ConfirmDialog isOpen={!!deletingExpense} onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteExpense} title="Eliminar gasto"
        message="¿Seguro que deseas eliminar este gasto?" loading={formLoading} />

      <ConfirmDialog isOpen={!!deletingIncome} onClose={() => setDeletingIncome(null)}
        onConfirm={handleDeleteIncome} title="Eliminar ingreso"
        message="¿Seguro que deseas eliminar este ingreso?" loading={formLoading} />
    </div>
  )
}
