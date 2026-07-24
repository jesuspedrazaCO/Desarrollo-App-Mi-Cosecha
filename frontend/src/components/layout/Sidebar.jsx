import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Sprout, Home, ShoppingCart, Receipt,
  CalendarDays, BarChart3, Sparkles, TrendingUp, Settings, Wheat,
  Map as MapIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000'

const navItems = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { to: '/crops', label: 'Cultivos', icon: Sprout },
  { to: '/household', label: 'Gastos del Hogar', icon: Home },
  { to: '/market', label: 'Lista de Mercado', icon: ShoppingCart },
  { to: '/receipts', label: 'Comprobantes', icon: Receipt },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/asesor', label: 'Asesor IA', icon: Sparkles },
  { to: '/market-prices', label: 'Precios Mercado', icon: TrendingUp },
  { to: '/planting-calculator', label: 'Calculadora de Siembra', icon: MapIcon },
  { to: '/agronomo', label: 'Agrónomo IA', icon: Leaf },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200
    ${isActive
      ? 'bg-gradient-to-r from-primary-500/90 to-primary-600/90 text-white shadow-[0_2px_12px_rgba(37,138,78,0.4)] border border-primary-400/30'
      : 'text-white/65 hover:text-white hover:bg-white/10 border border-transparent'
    }`

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-[268px] sidebar-glass flex flex-col
      transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white"
          style={{ boxShadow: '0 4px 16px rgba(37,138,78,0.5)' }}>
          <Wheat size={20} strokeWidth={2.2} />
        </div>
        <div>
          <p className="font-bold text-white text-[16px] leading-none font-display tracking-tight">AgroFinanzas</p>
          <p className="text-[11px] text-white/45 mt-1">{user?.farmName || 'Mi Finca'}</p>
        </div>
      </div>

      <div className="h-px mx-4 mb-3" style={{ background: 'rgba(255,255,255,0.08)' }} />

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3.5 mb-2 mt-1">Navegación</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={onClose} className={linkClass}>
            <item.icon size={17} className="flex-shrink-0" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3.5 mb-2 mt-5">Cuenta</p>
        <NavLink to="/settings" onClick={onClose} className={linkClass}>
          <Settings size={17} className="flex-shrink-0" strokeWidth={2} />
          Configuración
        </NavLink>
      </nav>

      <div className="px-3 pb-4">
        <div className="px-3.5 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid rgba(74,222,128,0.35)' }} />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #258a4e, #1a6e3c)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-white/90 truncate">{user?.name}</p>
            <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}