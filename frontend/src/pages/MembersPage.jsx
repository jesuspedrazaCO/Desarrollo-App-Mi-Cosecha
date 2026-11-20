import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UserPlus, Mail, Trash2, RefreshCw, UserX, UserCheck, Eye } from 'lucide-react'
import { getMembers, inviteMember, revokeInvitation, setMemberActive, removeMember } from '../services/memberService'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/formatDate'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import { SkeletonCards } from '../components/common/Skeleton'

const fieldStyle = {
  backgroundColor: 'rgba(255,255,255,0.88)', color: '#1c1917',
  border: '1px solid rgba(200,200,200,0.55)', borderRadius: '14px',
  padding: '10px 14px', fontSize: '14px', fontWeight: 500, width: '100%', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px',
}
const panel = { background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)' }
const iconBtn = 'w-8 h-8 rounded-full flex items-center justify-center text-white/55 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function MembersPage() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState({ members: [], invitations: [], max: 10 })
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null) // miembro a eliminar
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getMembers()
      setData(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cargar los miembros')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  // Solo el administrador gestiona miembros
  if (!isAdmin) return <Navigate to="/" replace />
  if (loading) return <SkeletonCards count={3} />

  const send = async (e) => {
    e.preventDefault()
    if (sending) return
    if (name.trim().length < 2) return toast.error('Escribe el nombre de la persona')
    if (!EMAIL_RE.test(email.trim())) return toast.error('Escribe un correo válido')
    setSending(true)
    try {
      await inviteMember({ name: name.trim(), email: email.trim() })
      toast.success('Invitación enviada por correo')
      setName(''); setEmail('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'No se pudo enviar la invitación')
    } finally {
      setSending(false)
    }
  }

  const resend = async (inv) => {
    setBusyId(inv._id)
    try {
      await inviteMember({ name: inv.name, email: inv.email })
      toast.success('Invitación reenviada')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo reenviar')
    } finally {
      setBusyId(null)
    }
  }

  const revoke = async (inv) => {
    setBusyId(inv._id)
    try {
      await revokeInvitation(inv._id)
      toast.success('Invitación cancelada')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cancelar')
    } finally {
      setBusyId(null)
    }
  }

  const toggleActive = async (m) => {
    setBusyId(m._id)
    try {
      await setMemberActive(m._id, !m.active)
      toast.success(m.active ? 'Acceso desactivado' : 'Acceso reactivado')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar')
    } finally {
      setBusyId(null)
    }
  }

  const doRemove = async () => {
    setRemoving(true)
    try {
      await removeMember(confirmRemove._id)
      toast.success('Miembro eliminado')
      setConfirmRemove(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar')
    } finally {
      setRemoving(false)
    }
  }

  const total = data.members.length + data.invitations.length
  const isEmpty = total === 0

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white font-display">Miembros de la finca</h1>
        <p className="text-xs text-white/45 mt-0.5">
          Invita a tu familia o socios para que vean cultivos, gastos e ingresos y descarguen PDF. No podrán registrar, editar ni borrar nada.
        </p>
      </div>

      <form onSubmit={send} noValidate className="rounded-3xl p-4 space-y-3" style={panel}>
        <p className="text-sm font-bold text-white/85 flex items-center gap-2"><UserPlus size={16} /> Invitar a alguien</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Nombre</label>
            <input style={fieldStyle} value={name} maxLength={80} placeholder="Ej: Papá, Carlos" onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Correo</label>
            <input type="email" style={fieldStyle} value={email} maxLength={120} placeholder="correo@ejemplo.com" onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-white/40 flex items-center gap-1.5"><Eye size={12} /> Rol: Lector · el enlace dura 7 días</p>
          <Button type="submit" loading={sending} disabled={total >= data.max}><Mail size={15} /> Enviar invitación</Button>
        </div>
        {total >= data.max && <p className="text-xs text-orange-300">Llegaste al máximo de {data.max} miembros e invitaciones.</p>}
      </form>

      {isEmpty ? (
        <EmptyState icon="👥" title="Aún no has invitado a nadie" description="Cuando invites a alguien, aparecerá aquí con su estado." />
      ) : (
        <div className="space-y-2">
          {data.members.map((m) => (
            <div key={m._id} className="rounded-2xl p-3.5 flex items-center justify-between gap-3" style={panel}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white/90 truncate">{m.name}</p>
                <p className="text-[11px] text-white/45 truncate">{m.email} · desde {formatDate(m.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge color={m.active ? 'green' : 'gray'}>{m.active ? 'Lector' : 'Desactivado'}</Badge>
                <button type="button" className={iconBtn} disabled={busyId === m._id}
                  aria-label={m.active ? 'Desactivar acceso' : 'Reactivar acceso'} title={m.active ? 'Desactivar acceso' : 'Reactivar acceso'}
                  onClick={() => toggleActive(m)}>
                  {m.active ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>
                <button type="button" className={`${iconBtn} hover:!text-red-300`} aria-label="Eliminar miembro" title="Eliminar miembro"
                  onClick={() => setConfirmRemove(m)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}

          {data.invitations.map((inv) => (
            <div key={inv._id} className="rounded-2xl p-3.5 flex items-center justify-between gap-3" style={panel}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white/90 truncate">{inv.name}</p>
                <p className="text-[11px] text-white/45 truncate">{inv.email} · vence {formatDate(inv.expiresAt)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge color="amber">Invitación pendiente</Badge>
                <button type="button" className={iconBtn} disabled={busyId === inv._id}
                  aria-label="Reenviar invitación" title="Reenviar invitación" onClick={() => resend(inv)}><RefreshCw size={15} /></button>
                <button type="button" className={`${iconBtn} hover:!text-red-300`} disabled={busyId === inv._id}
                  aria-label="Cancelar invitación" title="Cancelar invitación" onClick={() => revoke(inv)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Eliminar miembro" size="sm">
        {confirmRemove && (
          <div className="space-y-4">
            <p className="text-sm text-white/75">
              ¿Eliminar a <strong>{confirmRemove.name}</strong> ({confirmRemove.email})? Perderá el acceso de inmediato.
              Tus datos de la finca no se tocan. Si solo quieres pausar su acceso, usa "Desactivar".
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
              <button type="button" onClick={doRemove} disabled={removing}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-white bg-red-500/90 hover:bg-red-500 disabled:opacity-60 transition-colors">
                {removing ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}