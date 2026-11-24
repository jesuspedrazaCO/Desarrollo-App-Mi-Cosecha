import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useContributors } from '../hooks/useContributors'
import { useAuth } from '../hooks/useAuth'
import { getFarmWideContributorSummary } from '../services/contributorService'
import ContributorSummary from '../components/contributors/ContributorSummary'
import ContributorDetailModal from '../components/contributors/ContributorDetailModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Button from '../components/common/Button'
import { SkeletonList } from '../components/common/Skeleton'

const SCOPE_KEY = 'contributorsScope'
const readScope = () => {
  try { return localStorage.getItem(SCOPE_KEY) === 'all' ? 'all' : 'active' } catch { return 'active' }
}

export default function ContributorsPage() {
  const { contributors, loading: loadingList, create, remove } = useContributors()
  const { canEdit } = useAuth() // los lectores solo ven
  const [summary, setSummary] = useState([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState(null)
  const [scope, setScope] = useState(readScope)
  const changeScope = (value) => {
    setScope(value)
    try { localStorage.setItem(SCOPE_KEY, value) } catch { /* sin almacenamiento: no pasa nada */ }
  }

  const loadSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await getFarmWideContributorSummary(scope)
      setSummary(res.data.data)
    } catch {
      toast.error('Error al cargar el resumen')
    } finally {
      setLoadingSummary(false)
    }
  }

  useEffect(() => { loadSummary() }, [scope])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await create(newName.trim())
      setNewName('')
      toast.success('Aportante agregado')
      loadSummary()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al agregar')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async () => {
    try {
      await remove(deleting._id)
      toast.success('Aportante eliminado')
      setDeleting(null)
      loadSummary()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6 animate-float-up max-w-5xl">
      <div>
        <h1 className="page-title flex items-center gap-2"><Users size={22} /> Aportantes</h1>
        <p className="text-white/50 text-sm mt-1">Quién ha puesto plata en la finca, y cuánto — para repartir ganancias con claridad</p>
      </div>

      {/* Interruptor: lo aportado en todos los cultivos o solo en los activos */}
      <div className="flex items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Qué cultivos se cuentan en los aportes"
          className="inline-flex rounded-full p-1"
          style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          {[{ value: 'active', label: 'Solo activos' }, { value: 'all', label: 'Todo' }].map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={scope === o.value}
              onClick={() => changeScope(o.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                scope === o.value ? 'bg-primary-600 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-white/40 text-right">
          {scope === 'active' ? 'Sin cultivos finalizados ni suspendidos' : 'Incluye cultivos finalizados y suspendidos'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <ContributorSummary data={summary} loading={loadingSummary} title="Resumen general de la finca" onSelect={setSelected} />

        <div className="rounded-3xl p-5" style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <h3 className="text-[15px] font-bold text-white/90 mb-3">Personas registradas</h3>

          {canEdit && <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4">
            <input
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Fabio, Diego, Papá..."
              style={{ background: 'rgba(255,255,255,0.85)', color: '#1c1917' }}
              className="flex-1 rounded-2xl px-4 py-2.5 text-sm outline-none"
            />
            <Button type="submit" loading={adding} size="sm">
              <Plus size={15} className="mr-1" /> Agregar
            </Button>
          </form>}

          {loadingList ? (
            <SkeletonList rows={3} />
          ) : contributors.length === 0 ? (
            <p className="text-white/40 text-sm">{canEdit ? 'Aún no has agregado a nadie.' : 'Aún no hay personas registradas.'}</p>
          ) : (
            <div className="space-y-1">
              {contributors.map((c) => (
                <div key={c._id} className="flex items-center justify-between px-3 py-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-sm text-white/80 font-medium">{c.name}</span>
                  {canEdit && (
                    <button
                      onClick={() => setDeleting(c)}
                      className="p-1.5 rounded-full text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ContributorDetailModal contributor={selected} onClose={() => setSelected(null)} scope={scope} />

      {canEdit && <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar aportante"
        message={`¿Eliminar a "${deleting?.name}"? Los gastos donde ya se marcó que pagó no se borran, pero dejarán de mostrarlo en los resúmenes.`}
      />}
    </div>
  )
}