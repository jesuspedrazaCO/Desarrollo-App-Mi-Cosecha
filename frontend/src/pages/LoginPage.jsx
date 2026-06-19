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
      {/* Decoración de fondo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-300/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-float-up">
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-elevated border border-white/60 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow text-3xl">
              🌾
            </div>
            <h1 className="text-2xl font-bold text-stone-900 font-display tracking-tight">AgroFinanzas</h1>
            <p className="text-stone-500 text-sm mt-1.5">Gestiona las finanzas de tu finca y tu hogar</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <h2 className="text-lg font-bold text-stone-900 mb-6 font-display">Iniciar sesión</h2>

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

            <p className="text-center text-sm text-stone-500 mt-6">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                Regístrate gratis
              </Link>
            </p>

            <div className="mt-6 p-4 bg-primary-50/70 backdrop-blur-sm rounded-2xl text-xs text-stone-500 border border-primary-100">
              <p className="font-bold text-stone-600 mb-1">Usuario de prueba:</p>
              <p>📧 productor@agrofinanzas.com / agro123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
