import { Smartphone } from 'lucide-react'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import Button from './Button'

// Tarjeta para instalar la app en el celular (ícono en la pantalla de inicio y uso sin internet)
export default function InstallAppCard() {
  const { installed, canInstall, isIOS, install } = useInstallPrompt()

  return (
    <div className="rounded-3xl p-6"
      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.13)' }}>
      <h3 className="text-[15px] font-bold text-white/90 mb-3 flex items-center gap-2"><Smartphone size={16} /> App en tu celular</h3>

      {installed ? (
        <p className="text-sm text-emerald-300">✅ AgroFinanzas ya está instalada en este dispositivo.</p>
      ) : canInstall ? (
        <div className="space-y-3">
          <p className="text-sm text-white/60">Instálala para abrirla desde un ícono, a pantalla completa, sin buscar el enlace.</p>
          <Button type="button" onClick={install}>Instalar AgroFinanzas</Button>
        </div>
      ) : isIOS ? (
        <ol className="text-sm text-white/65 space-y-1.5 list-decimal pl-5">
          <li>Abre esta página en <strong className="text-white/85">Safari</strong>.</li>
          <li>Toca el botón <strong className="text-white/85">Compartir</strong> (el cuadro con la flecha hacia arriba).</li>
          <li>Elige <strong className="text-white/85">Agregar a pantalla de inicio</strong> y confirma.</li>
        </ol>
      ) : (
        <p className="text-sm text-white/60">
          Abre el menú del navegador (⋮) y elige <strong className="text-white/85">Instalar app</strong> o{' '}
          <strong className="text-white/85">Agregar a pantalla de inicio</strong>.
        </p>
      )}
    </div>
  )
}