import { formatDate } from '../../utils/formatDate'
import { APPLICATION_TYPES } from '../../utils/constants'
import Table from '../common/Table'
import Badge from '../common/Badge'
import Button from '../common/Button'

export default function ApplicationTable({ applications, loading, onEdit, onDelete }) {
  const getTypeInfo = (val) => APPLICATION_TYPES.find(t => t.value === val) || APPLICATION_TYPES[3]

  const columns = [
    {
      key: 'date', label: 'Fecha',
      render: (a) => <span className="text-white/65 text-sm">{formatDate(a.date)}</span>,
    },
    {
      key: 'type', label: 'Labor',
      render: (a) => {
        const info = getTypeInfo(a.type)
        return <Badge color="green">{info.icon} {info.label}</Badge>
      },
    },
    {
      key: 'product', label: 'Producto',
      render: (a) => <span className="text-sm font-semibold text-white/85">{a.product}</span>,
    },
    {
      key: 'quantity', label: 'Cantidad',
      render: (a) => <span className="text-sm text-white/70">{a.quantity} {a.unit}</span>,
    },
    {
      key: 'tank', label: 'Tanque/caneca',
      render: (a) => (
        <span className="text-sm text-white/60">
          {a.tankVolume ? `${a.tankVolume} ${a.tankUnit}` : '—'}
        </span>
      ),
    },
    {
      key: 'observations', label: 'Notas',
      render: (a) => <span className="text-xs text-white/45 truncate block max-w-[180px]">{a.observations || '—'}</span>,
    },
    {
      key: 'actions', label: '',
      render: (a) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={() => onEdit(a)}>✏️</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(a)}>🗑️</Button>
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={applications}
      loading={loading}
      emptyMessage="No hay insumos registrados"
      emptyIcon="🧪"
    />
  )
}