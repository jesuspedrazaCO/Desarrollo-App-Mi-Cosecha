import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '../validators/authSchema'
import { useAuth } from '../hooks/useAuth'
import { updateMe } from '../services/authService'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      farmName: user?.farmName || '',
      location: user?.location || '',
      phone: user?.phone || '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        name: data.name,
        farmName: data.farmName,
        location: data.location,
        phone: data.phone,
      }
      if (data.password) payload.password = data.password
      const res = await updateMe(payload)
      updateUser(res.data.user)
      toast.success('Perfil actualizado correctamente')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-float-up max-w-2xl">
      <div>
        <h1 className="page-title">Configuración ⚙️</h1>
        <p className="text-stone-500 text-sm mt-1">Administra tu perfil y datos de tu finca</p>
      </div>

      {/* Avatar */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-soft">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-stone-900 text-lg font-display">{user?.name}</h2>
            <p className="text-stone-500 text-sm">{user?.email}</p>
            <p className="text-primary-600 text-sm font-medium">🌾 {user?.farmName}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-6">
        <h3 className="section-title mb-5">Datos personales y de la finca</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre completo" required
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Nombre de la finca"
              placeholder="Ej: Finca La Esperanza"
              error={errors.farmName?.message}
              {...register('farmName')}
            />
            <Input
              label="Ubicación"
              placeholder="Vereda, municipio, departamento"
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

          <div className="border-t border-stone-100 pt-4">
            <h4 className="text-[13px] font-bold text-stone-700 mb-3">Cambiar contraseña (opcional)</h4>
            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="Dejar vacío para no cambiar"
              hint="Mínimo 6 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={loading}>Guardar cambios</Button>
          </div>
        </form>
      </div>

      {/* Info cuenta */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-card border border-white/60 p-6">
        <h3 className="section-title mb-4">Información de la cuenta</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-stone-50">
            <span className="text-sm text-stone-500">Correo electrónico</span>
            <span className="text-sm font-semibold text-stone-800">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-stone-50">
            <span className="text-sm text-stone-500">Versión</span>
            <span className="text-sm font-semibold text-stone-800">AgroFinanzas v1.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-stone-500">Estado</span>
            <span className="text-sm font-semibold text-primary-600">✅ Cuenta activa</span>
          </div>
        </div>
      </div>
    </div>
  )
}
