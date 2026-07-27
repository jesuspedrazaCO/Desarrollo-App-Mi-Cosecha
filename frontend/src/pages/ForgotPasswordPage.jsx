import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { forgotPassword } from '../services/authService'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a1c10' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <Link to="/login" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-5 transition-colors">
          <ArrowLeft size={16} /> Volver a iniciar sesión
        </Link>

        <h1 className="font-fraunces text-xl text-white mb-2">¿Olvidaste tu contraseña?</h1>

        {sent ? (
          <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <p className="text-sm text-emerald-300">
              Si <strong>{email}</strong> está registrado, te enviamos un correo con instrucciones. Revisa también tu carpeta de spam.
            </p>
          </div>
        ) : (
          <>
            <p className="text-white/50 text-sm mb-5">
              Escribe tu correo y te enviamos un enlace para restablecer tu contraseña.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.85)' }}>
                <Mail size={16} className="text-stone-500 flex-shrink-0" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: '#1c1917' }}
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: '#258a4e' }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}