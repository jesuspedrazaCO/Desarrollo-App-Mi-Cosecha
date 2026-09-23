import { useState } from 'react'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import { INCOME_TYPES } from '../../utils/constants'
import Table from '../common/Table'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'

export default function IncomeTable({ incomes, loading, onEdit, onDelete }) {
  const [detailIncome, setDetailIncome] = useState(null)
  const getTypeLabel = (val) => INCOME_TYPES.find(t => t.value === val)?.label || val

  const getItems = (income) => {
    if (Array.isArray(income.items) && income.items.length > 0) return income.items
    // Compatibilidad con ventas antiguas sin desglose por producto
    if (income.quantitySold > 0) {
      return [{
        variety: getTypeLabel(income.type),
        quantitySold: income.quantitySold,
        unit: income.unit,
        crates: 0,
        salePrice: income.salePrice,
        subtotal: income.totalAmount,
      }]
    }
    return []
  }

  const columns = [
    {
      key: 'date', label: 'Fecha',
      render: (i) => <span className="text-white/65 text-sm">{formatDate(i.date)}</span>,
    },
    {
      key: 'type', label: 'Tipo',
      render: (i) => <Badge color="green">{getTypeLabel(i.type)}</Badge>,
    },
    {
      key: 'client', label: 'Cliente',
      render: (i) => <span className="text-sm text-white/70">{i.client || '—'}</span>,
    },
    {
      key: 'products', label: 'Productos',
      render: (i) => {
        const count = getItems(i).length
        return (
          <button
            onClick={() => setDetailIncome(i)}
            className="text-sm text-primary-300 hover:text-primary-200 underline underline-offset-2"
          >
            {count} {count === 1 ? 'producto' : 'productos'}
          </button>
        )
      },
    },
    {
      key: 'totalAmount', label: 'Total',
      render: (i) => <span className="text-sm font-bold text-emerald-300">{formatCurrency(i.totalAmount)}</span>,
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
    <>
      <Table
        columns={columns}
        data={incomes}
        loading={loading}
        emptyMessage="No hay ingresos registrados"
        emptyIcon="📈"
      />

      <Modal
        isOpen={!!detailIncome}
        onClose={() => setDetailIncome(null)}
        title={detailIncome ? `Venta del ${formatDate(detailIncome.date)}` : ''}
      >
        {detailIncome && (
          <div className="space-y-3">
            {detailIncome.client && (
              <p className="text-sm text-white/60">
                Cliente: <span className="text-white/85">{detailIncome.client}</span>
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-white/50 border-b border-white/10">
                    <th className="py-2 pr-3">Producto</th>
                    <th className="py-2 pr-3">Cantidad</th>
                    <th className="py-2 pr-3">Canastillas</th>
                    <th className="py-2 pr-3">Precio/u.</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {getItems(detailIncome).map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-2 pr-3 text-white/85">{item.variety}</td>
                      <td className="py-2 pr-3 text-white/70">{item.quantitySold} {item.unit}</td>
                      <td className="py-2 pr-3 text-white/70">{item.crates || '—'}</td>
                      <td className="py-2 pr-3 text-white/70">{formatCurrency(item.salePrice)}</td>
                      <td className="py-2 text-right text-emerald-300 font-semibold">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right pt-2 border-t border-white/10">
              <span className="text-sm text-white/60">Total: </span>
              <span className="text-base font-bold text-emerald-300">{formatCurrency(detailIncome.totalAmount)}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}