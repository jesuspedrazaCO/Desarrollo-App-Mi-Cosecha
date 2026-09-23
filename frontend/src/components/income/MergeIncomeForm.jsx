import { useState } from 'react'
import { formatDate } from '../../utils/formatDate'
import { formatCurrency } from '../../utils/formatCurrency'
import Input from '../common/Input'
import Button from '../common/Button'

export default function MergeIncomeForm({ selected, onConfirm, onCancel, loading }) {
  const [items, setItems] = useState(
    selected.flatMap((income) => {
      if (Array.isArray(income.items) && income.items.length > 0) {
        return income.items.map((it) => ({ ...it }))
      }
      return [{
        variety: '',
        quantitySold: income.quantitySold || 0,
        unit: income.unit || 'kg',
        crates: 0,
        salePrice: income.salePrice || 0,
      }]
    })
  )
  const [client, setClient] = useState(selected[0]?.client || '')
  const [observations, setObservations] = useState('')

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => i === index ? { ...it, [field]: value } : it))
  }

  const total = items.reduce((sum, it) => sum + (Number(it.quantitySold) || 0) * (Number(it.salePrice) || 0), 0)
  const totalKg = items.reduce((sum, it) => {
    const unit = (it.unit || 'kg').trim().toLowerCase()
    if (unit !== 'kg') return sum
    return sum + (Number(it.quantitySold) || 0)
  }, 0)
  const totalCrates = items.reduce((sum, it) => sum + (Number(it.crates) || 0), 0)
  const canSubmit = items.every((it) => it.variety.trim().length > 0)

  const handleSubmit = () => {
    onConfirm({
      ids: selected.map(s => s._id),
      crop: selected[0].crop._id || selected[0].crop,
      date: selected[0].date,
      client,
      type: selected[0].type,
      observations,
      items,
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">
        Estás agrupando <span className="text-white/85 font-semibold">{selected.length} ventas</span> en una sola.
        Los registros originales se eliminarán y solo quedará esta venta consolidada.
      </p>

      <Input
        label="Cliente"
        placeholder="Nombre del comprador"
        value={client}
        onChange={(e) => setClient(e.target.value)}
      />

      <div>
        <label className="block text-[13px] font-semibold text-white/80 mb-2">
          Asigna la variedad de cada línea
        </label>
        <div className="space-y-2.5">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label="Producto / variedad"
                    placeholder="Ej: Piña gruesa"
                    value={item.variety}
                    onChange={(e) => updateItem(index, 'variety', e.target.value)}
                  />
                </div>
                <Input
                  label="Cantidad" type="number" min="0" step="0.1"
                  value={item.quantitySold}
                  onChange={(e) => updateItem(index, 'quantitySold', e.target.value)}
                />
                <Input
                  label="Canastillas (opcional)" type="number" min="0" step="1"
                  value={item.crates}
                  onChange={(e) => updateItem(index, 'crates', e.target.value)}
                />
                <Input
                  label="Precio/unidad ($)" type="number" min="0" step="1"
                  value={item.salePrice}
                  onChange={(e) => updateItem(index, 'salePrice', e.target.value)}
                />
              </div>
              <p className="text-xs text-white/45 mt-2">
                Subtotal: <span className="font-semibold text-emerald-300">
                  {formatCurrency((Number(item.quantitySold) || 0) * (Number(item.salePrice) || 0))}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Total agrupado</span>
          <span className="text-lg font-bold text-emerald-300">{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center gap-4 mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(16,185,129,0.14)' }}>
          <span className="text-xs text-white/50">{totalKg.toLocaleString('es-CO')} kg en total</span>
          {totalCrates > 0 && (
            <span className="text-xs text-white/50">{totalCrates.toLocaleString('es-CO')} canastillas</span>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="button" disabled={!canSubmit} loading={loading} onClick={handleSubmit}>
          Confirmar y agrupar
        </Button>
      </div>
    </div>
  )
}