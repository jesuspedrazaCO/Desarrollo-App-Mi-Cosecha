import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import { INCOME_TYPES } from '../../utils/constants'
import Table from '../common/Table'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function IncomeTable({ incomes, loading, onEdit, onDelete }) {
  const getTypeLabel = (val) => INCOME_TYPES.find(t => t.value === val)?.label || val

  const columns = [
    {
      key: 'date', label: 'Fecha',
      render: (i) => <span className="text-stone-600 text-sm">{formatDate(i.date)}</span>,
    },
    {
      key: 'type', label: 'Tipo',
      render: (i) => <Badge color="green">{getTypeLabel(i.type)}</Badge>,
    },
    {
      key: 'client', label: 'Cliente',
      render: (i) => <span className="text-sm text-stone-600">{i.client || '—'}</span>,
    },
    {
      key: 'quantity', label: 'Cantidad',
      render: (i) => (
        <span className="text-sm text-stone-600">
          {i.quantitySold > 0 ? `${i.quantitySold} ${i.unit}` : '—'}
        </span>
      ),
    },
    {
      key: 'totalAmount', label: 'Total',
      render: (i) => <span className="text-sm font-bold text-primary-700">{formatCurrency(i.totalAmount)}</span>,
    },
    {
      key: 'actions', label: '',
      render: (i) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => onEdit(i)}>✏️</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(i)}>🗑️</Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={incomes}
      loading={loading}
      emptyMessage="No hay ingresos registrados"
      emptyIcon="📈"
    />
  )
}
