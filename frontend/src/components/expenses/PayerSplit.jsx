import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useContributors } from '../../hooks/useContributors'

// payers: [{ contributor: id, amount: number }]
export default function PayerSplit({ payers, onChange, totalAmount }) {
  const { contributors, loading, create } = useContributors()
  const [newName, setNewName] = useState('')
  const [addingContributor, setAddingContributor] = useState(false)

  const totalAssigned = payers.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const diff = (Number(totalAmount) || 0) - totalAssigned

  const addPayer = (contributorId) => {
    if (payers.some((p) => p.contributor === contributorId)) return
    onChange([...payers, { contributor: contributorId, amount: diff > 0 ? diff : 0 }])
  }

  const removePayer = (contributorId) => {
    onChange(payers.filter((p) => p.contributor !== contributorId))
  }

  const updateAmount = (contributorId, amount) => {
    onChange(payers.map((p) => (p.contributor === contributorId ? { ...p, amount: Number(amount) } : p)))
  }

  const handleAddContributor = async () => {
    if (!newName.trim()) return
    setAddingContributor(true)
    try {
      await create(newName.trim())
      setNewName('')
    } finally {
      setAddingContributor(false)
    }
  }

  const getContributorName = (id) => contributors.find((c) => c._id === id)?.name || '—'

  return (
    <div className="sm:col-span-2">
      <label className="block text-[13px] font-semibold text-stone-700 mb-1.5">
        ¿Quién(es) pagaron este gasto? <span className="text-stone-400 font-normal">(opcional)</span>
      </label>

      {/* Aportantes ya agregados a este gasto, con su monto */}
      {payers.length > 0 && (
        <div className="space-y-2 mb-2">
          {payers.map((p) => (
            <div key={p.contributor} className="flex items-center gap-2">
              <span className="text-sm text-stone-700 w-28 flex-shrink-0 truncate">{getContributorName(p.contributor)}</span>
              <input
                type="number" min="0" step="1"
                value={p.amount}
                onChange={(e) => updateAmount(p.contributor, e.target.value)}
                className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
              />
              <button type="button" onClick={() => removePayer(p.contributor)}
                className="p-1.5 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Validación visual de la suma */}
      {payers.length > 0 && (
        <p className={`text-xs mb-2 font-medium ${diff === 0 ? 'text-primary-600' : 'text-accent-600'}`}>
          {diff === 0
            ? '✓ Cuadra con el valor total del gasto'
            : diff > 0
              ? `Faltan $${diff.toLocaleString('es-CO')} por asignar`
              : `Te pasaste por $${Math.abs(diff).toLocaleString('es-CO')}`}
        </p>
      )}

      {/* Selector de aportantes disponibles */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {!loading && contributors
          .filter((c) => !payers.some((p) => p.contributor === c._id))
          .map((c) => (
            <button
              key={c._id} type="button" onClick={() => addPayer(c._id)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-stone-200 text-stone-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
            >
              + {c.name}
            </button>
          ))}
      </div>

      {/* Agregar un aportante nuevo a la lista */}
      <div className="flex items-center gap-2">
        <input
          type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="Agregar persona nueva (ej: Fabio)"
          className="flex-1 border border-stone-200 rounded-xl px-3 py-1.5 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-400/40"
        />
        <button
          type="button" onClick={handleAddContributor} disabled={addingContributor || !newName.trim()}
          className="p-2 rounded-xl bg-primary-100 text-primary-700 hover:bg-primary-200 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}