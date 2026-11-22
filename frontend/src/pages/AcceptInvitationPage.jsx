import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Sprout } from 'lucide-react'
import toast from 'react-hot-toast'
import { getInvitation } from '../services/authService'
import { useAuth } from '../hooks/useAuth'

export default function AcceptInvitationPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { acceptInvitation } = useAuth()
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState('')
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    getInvitation(token)
      .then((res) => { if (active) setInvite(res.data) })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'La invitación es inválida o ya expiró.') })
      .finally(() => { if (active) setLoadingInvite(false) })
    return () => { active = false }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (password.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres')
    if (password !== confirmPassword) return toast.error('Las contraseñas no coinciden')
    setSaving(true)
    try {
      await acceptInvitation(token, password)
      toast.success('¡Bienvenido a la finca!')
      navigate('/', { replace: true })
    } catch (err) {
      const details = err.response?.data?.errors
      toast.error(details?.[0]?.msg || err.response?.data?.message || 'No se pudo aceptar la invitación')
    } finally {
      setSaving(false)
    }
  }

  const card = { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.15)' }

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 overflow-y-auto" style={{ background: '#0a1c10' }}>
      <div className="w-full max-w-sm rounded-3xl p-6" style={card}>
        {loadingInvite ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center space-y-4">
            <h1 className="font-fraunces text-xl text-white">Invitación no disponible</h1>
            <p className="text-white/55 text-sm">{error}</p>
            <Link to="/login" className="inline-block text-sm font-semibold text-emerald-400 hover:text-emerald-300">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white mb-4" style={{ background: '#258a4e' }}>
              <Sprout size={22} />
            </div>
            <h1 className="font-fraunces text-xl text-white mb-2">Hola, {invite.name}</h1>
            <p className="text-white/55 text-sm mb-5">
              <strong className="text-white/80">{invite.inviterName}</strong> te invitó a {invite.role === 'editor' ? 'colaborar en' : 'ver'}{' '}
              <strong className="text-white/80">{invite.farmName || 'su finca'}</strong> en AgroFinanzas.
              {invite.role === 'editor'
                ? ' Podrás consultar todo, descargar PDF y registrar o editar datos (no podrás invitar ni quitar miembros).'
                : ' Podrás consultar todo y descargar PDF, sin modificar datos.'}
              {' '}Crea tu contraseña para entrar con{' '}
              <strong className="text-white/80">{invite.email}</strong>.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
                <Lock size={16} className="text-stone-500 flex-shrink-0" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crea tu contraseña (mín. 8 caracteres)" autoComplete="new-password"
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#1c1917' }}
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
                <Lock size={16} className="text-stone-500 flex-shrink-0" />
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma la contraseña" autoComplete="new-password"
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: '#1c1917' }}
                />
              </div>
              <button
                type="submit" disabled={saving}
                className="w-full py-2.5 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: '#258a4e' }}
              >
                {saving ? 'Creando acceso...' : 'Aceptar invitación'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}