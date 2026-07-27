import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../services/authService'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      toast.success('Contraseña actualizada. Ya puedes iniciar sesión.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'El enlace es inválido o expiró')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 overflow-y-auto" style={{ background: '#0a1c10' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-5 transition-colors">
          <ArrowLeft size={16} /> Volver a iniciar sesión
        </Link>

        <h1 className="font-fraunces text-xl text-white mb-2">Nueva contraseña</h1>
        <p className="text-white/50 text-sm mb-5">Escribe tu nueva contraseña para tu cuenta de AgroFinanzas.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <Lock size={16} className="text-stone-500 flex-shrink-0" />
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#1c1917' }}
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <Lock size={16} className="text-stone-500 flex-shrink-0" />
            <input
              type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma la contraseña"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#1c1917' }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: '#258a4e' }}
          >
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}