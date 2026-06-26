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
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(74,222,128,0.12)' }} />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(37,138,78,0.18)' }} />

      <div className="w-full max-w-[420px] relative z-10 animate-float-up">
        <div className="rounded-[2rem] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(48px) saturate(200%)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 24px 80px -12px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl"
              style={{ background: 'linear-gradient(135deg, #258a4e, #1a6e3c)', boxShadow: '0 8px 32px rgba(37,138,78,0.5)' }}>
              🌱
            </div>
            <h1 className="text-[24px] font-bold text-white font-display tracking-tight">Crea tu cuenta</h1>
            <p className="text-white/45 text-sm mt-1.5">Empieza a organizar las finanzas de tu finca</p>
          </div>

          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nombre completo" required placeholder="Tu nombre" error={errors.name?.message} {...register('name')} />
              <Input label="Correo electrónico" type="email" required placeholder="tucorreo@ejemplo.com" error={errors.email?.message} {...register('email')} />
              <Input label="Contraseña" type="password" required placeholder="Mínimo 6 caracteres" error={errors.password?.message} {...register('password')} />
              <Input label="Nombre de la finca" placeholder="Ej: Finca La Esperanza" error={errors.farmName?.message} {...register('farmName')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ubicación" placeholder="Vereda, municipio" error={errors.location?.message} {...register('location')} />
                <Input label="Teléfono" placeholder="300 123 4567" error={errors.phone?.message} {...register('phone')} />
              </div>
              <Button type="submit" loading={loading} className="w-full mt-6" size="lg">Crear mi cuenta</Button>
            </form>

            <p className="text-center text-[13px] text-white/40 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-mint-400 font-semibold hover:text-mint-300 transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
