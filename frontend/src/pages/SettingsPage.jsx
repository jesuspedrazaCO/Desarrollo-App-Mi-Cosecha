import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { updateMe } from '../services/authService'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const fileInputRef = useRef(null)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: user?.name || '',
      farmName: user?.farmName || '',
      location: user?.location || '',
      phone: user?.phone || '',
      password: '',
    },
  })

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2MB'); return }

    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)

    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await api.put('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser(res.data.user)
      setAvatarPreview(res.data.user.avatar)
      toast.success('Foto actualizada correctamente')
    } catch {
      toast.error('Error al subir la foto')
      setAvatarPreview(user?.avatar || null)
    } finally {
      setAvatarLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = { name: data.name, farmName: data.farmName, location: data.location, phone: data.phone }
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
        <p className="text-white/50 text-sm mt-1">Administra tu perfil y datos de tu finca</p>
      </div>

      {/* Perfil con foto */}
      <div className="rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)' }}>
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Foto de perfil"
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: '2px solid rgba(74,222,128,0.40)', boxShadow: '0 4px 16px rgba(0,0,0,0.30)' }} />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
                style={{ background: 'linear-gradient(135deg, #258a4e, #1a6e3c)', boxShadow: '0 4px 16px rgba(37,138,78,0.45)' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              {avatarLoading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <span className="text-white text-xl">📷</span>}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
          <div>
            <h2 className="font-bold text-white text-lg font-display">{user?.name}</h2>
            <p className="text-white/50 text-sm">{user?.email}</p>
            <p className="text-emerald-400 text-sm font-medium mt-0.5">🌾 {user?.farmName}</p>
            <p className="text-white/30 text-xs mt-2">Haz clic en la foto para cambiarla · JPG, PNG o WEBP, máx 2MB</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)' }}>
        <h3 className="text-[15px] font-bold text-white/90 mb-5">Datos personales y de la finca</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre completo" required error={errors.name?.message} {...register('name')} />
            <Input label="Nombre de la finca" placeholder="Ej: Finca La Esperanza" {...register('farmName')} />
            <Input label="Ubicación" placeholder="Vereda, municipio, departamento" {...register('location')} />
            <Input label="Teléfono" placeholder="300 123 4567" {...register('phone')} />
          </div>
          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 className="text-[13px] font-bold text-white/50 mb-3">Cambiar contraseña (opcional)</h4>
            <Input label="Nueva contraseña" type="password" placeholder="Dejar vacío para no cambiar" hint="Mínimo 6 caracteres" {...register('password')} />
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={loading}>Guardar cambios</Button>
          </div>
        </form>
      </div>

      {/* Info cuenta */}
      <div className="rounded-3xl p-6"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)' }}>
        <h3 className="text-[15px] font-bold text-white/90 mb-4">Información de la cuenta</h3>
        <div className="space-y-3">
          {[
            { label: 'Correo electrónico', value: user?.email },
            { label: 'Versión', value: 'AgroFinanzas v1.0' },
            { label: 'Estado', value: '✅ Cuenta activa', green: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 last:border-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-sm text-white/45">{item.label}</span>
              <span className={`text-sm font-semibold ${item.green ? 'text-emerald-400' : 'text-white/80'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
