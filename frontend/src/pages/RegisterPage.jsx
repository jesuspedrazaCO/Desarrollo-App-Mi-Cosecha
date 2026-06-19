import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { registerSchema } from '../validators/authSchema'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await registerUser(data)
      toast.success('¡Cuenta creada! Bienvenido a AgroFinanzas')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-300/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-float-up">
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-elevated border border-white/60 overflow-hidden">
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-glow text-3xl">
              🌱
            </div>
            <h1 className="text-2xl font-bold text-stone-900 font-display tracking-tight">Crea tu cuenta</h1>
            <p className="text-stone-500 text-sm mt-1.5">Empieza a organizar las finanzas de tu finca hoy</p>
          </div>

          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nombre completo"
                required
                placeholder="Tu nombre"
                error={errors.name?.message}
                {...register('name')}
              />
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
                placeholder="Mínimo 6 caracteres"
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Nombre de la finca"
                placeholder="Ej: Finca La Esperanza"
                error={errors.farmName?.message}
                {...register('farmName')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ubicación"
                  placeholder="Vereda, municipio"
                  error={errors.location?.message}
                  {...register('location')}
                />
                <Input
                  label="Teléfono"
                  placeholder="300 123 4567"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full mt-6" size="lg">
                Crear mi cuenta
              </Button>
            </form>

            <p className="text-center text-sm text-stone-500 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
