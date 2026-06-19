import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Inicio', icon: '🏡', exact: true },
  { to: '/crops', label: 'Cultivos', icon: '🌱' },
  { to: '/household', label: 'Gastos del Hogar', icon: '🏠' },
  { to: '/market', label: 'Lista de Mercado', icon: '🛒' },
  { to: '/receipts', label: 'Comprobantes', icon: '🧾' },
  { to: '/calendar', label: 'Calendario', icon: '🗓️' },
  { to: '/reports', label: 'Reportes', icon: '📊' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[14px] font-semibold transition-all duration-200 ease-smooth
    ${isActive
      ? 'bg-primary-600 text-white shadow-soft'
      : 'text-stone-600 hover:bg-white/70 hover:text-primary-700'
    }`

  return (
    <aside
      className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-[270px] bg-white/60 backdrop-blur-2xl border-r border-white/60
        flex flex-col transition-transform duration-300 ease-smooth
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-white text-lg shadow-soft">
          🌾
        </div>
        <div>
          <p className="font-bold text-stone-900 text-[16px] leading-none font-display tracking-tight">AgroFinanzas</p>
          <p className="text-[12px] text-stone-400 mt-1">{user?.farmName || 'Mi Finca'}</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3.5 mb-2 mt-2">Navegación</p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={onClose} className={linkClass}>
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-3.5 mb-2 mt-5">Cuenta</p>
        <NavLink to="/settings" onClick={onClose} className={linkClass}>
          <span className="text-lg">⚙️</span>
          Configuración
        </NavLink>
      </nav>

      {/* Usuario actual */}
      <div className="px-4 py-4 mx-3 mb-3 rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-soft">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-stone-900 truncate">{user?.name}</p>
            <p className="text-[12px] text-stone-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
