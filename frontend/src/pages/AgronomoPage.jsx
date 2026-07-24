import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AgroChat from '../components/agro/AgroChat'

export default function AgronomoPage() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link
          to="/"
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Volver al inicio"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-fraunces text-xl sm:text-2xl text-white">Agrónomo IA</h1>
      </div>
      <AgroChat />
      <p className="text-[11px] text-white/30 text-center mt-4 px-4">
        Las recomendaciones son orientativas. Para dosis exactas de agroquímicos, confirma
        siempre la etiqueta del producto. Para casos graves, consulta al ICA o un agrónomo certificado.
      </p>
    </div>
  )
}