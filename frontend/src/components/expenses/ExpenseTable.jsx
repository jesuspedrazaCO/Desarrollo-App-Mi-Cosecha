import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import { EXPENSE_CATEGORIES } from '../../utils/constants'
import Table from '../common/Table'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function ExpenseTable({ expenses, loading, onEdit, onDelete }) {
  const getCategoryInfo = (key) =>
    EXPENSE_CATEGORIES.find(c => c.value === key) || { label: key, icon: '📦' }

  const columns = [
    {
      key: 'date', label: 'Fecha',
      render: (e) => <span className="text-white/65 text-sm">{formatDate(e.date)}</span>,
    },
    {
      key: 'category', label: 'Categoría',
      render: (e) => {
        const cat = getCategoryInfo(e.category)
        return (
          <div className="flex items-center gap-1.5">
            <span>{cat.icon}</span>
            <span className="text-sm font-medium text-white/80">{cat.label}</span>
          </div>
        )
      },
    },
    {
      key: 'description', label: 'Descripción',
      render: (e) => <span className="text-sm text-white/80 line-clamp-1">{e.description}</span>,
    },
    {
      key: 'amount', label: 'Valor',
      render: (e) => <span className="text-sm font-bold text-orange-300">{formatCurrency(e.amount)}</span>,
    },
    {
      key: 'paymentMethod', label: 'Pago',
      render: (e) => <Badge color="gray">{e.paymentMethod}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (e) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => onEdit(e)}>✏️</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(e)}>🗑️</Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={expenses}
      loading={loading}
      emptyMessage="No hay gastos registrados"
      emptyIcon="💰"
    />
  )
}