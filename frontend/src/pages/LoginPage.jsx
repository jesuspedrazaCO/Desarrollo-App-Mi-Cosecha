import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginSchema } from '../validators/authSchema'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('¡Bienvenido de nuevo!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Orbs de fondo */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(37,138,78,0.20)' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(74,222,128,0.12)' }} />

      <div className="w-full max-w-[400px] relative z-10 animate-float-up">
        <div className="rounded-[2rem] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 24px 80px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          {/* Header */}
          <div className="px-8 pt-10 pb-7 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{
                background: 'linear-gradient(135deg, #258a4e 0%, #1a6e3c 100%)',
                boxShadow: '0 8px 32px rgba(37,138,78,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}>
              🌾
            </div>
            <h1 className="text-[26px] font-bold text-white font-display tracking-tight">AgroFinanzas</h1>
            <p className="text-white/45 text-sm mt-1.5">Gestiona las finanzas de tu finca y tu hogar</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <h2 className="text-[17px] font-bold text-white/90 mb-5 font-display">Iniciar sesión</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Correo electrónico"
                type="email"
                required
                placeholder="tucorreo@ejemplo.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Contraseña"
                type="password"
                required
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" loading={loading} className="w-full mt-6" size="lg">
                Ingresar a mi finca
              </Button>
            </form>

            <p className="text-center text-[13px] text-white/40 mt-6">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-mint-400 font-semibold hover:text-mint-300 transition-colors">
                Regístrate gratis
              </Link>
            </p>

            <div className="mt-5 p-3.5 rounded-2xl text-xs text-white/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="font-bold text-white/55 mb-1">Usuario de prueba</p>
              <p>📧 productor@agrofinanzas.com / agro123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
