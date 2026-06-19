import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-300/30 rounded-full blur-3xl" />

      <div className="text-center relative z-10 animate-float-up">
        <p className="text-8xl mb-4">🌾</p>
        <h1 className="text-6xl font-bold text-primary-600 mb-2 font-display">404</h1>
        <p className="text-xl font-bold text-stone-900 mb-2 font-display">Página no encontrada</p>
        <p className="text-stone-500 mb-8">Esta parcela aún no ha sido sembrada.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="secondary">Volver</Button>
          <Button onClick={() => navigate('/')}>Ir al inicio</Button>
        </div>
      </div>
    </div>
  )
}
