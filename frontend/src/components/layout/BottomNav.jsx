import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Sprout, Sparkles, BarChart3, Menu } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { to: '/crops', label: 'Cultivos', icon: Sprout },
  { to: '/asesor', label: 'Asesor IA', icon: Sparkles },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
]

export default function BottomNav({ onMoreClick, isMoreActive }) {
  const tabClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-semibold transition-colors duration-150
    ${isActive ? 'text-primary-400' : 'text-white/50'}`

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(20,28,22,0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.exact} className={tabClass}>
          <tab.icon size={20} strokeWidth={2} />
          {tab.label}
        </NavLink>
      ))}

      <button
        onClick={onMoreClick}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10px] font-semibold transition-colors duration-150
          ${isMoreActive ? 'text-primary-400' : 'text-white/50'}`}
      >
        <Menu size={20} strokeWidth={2} />
        Más
      </button>
    </nav>
  )
}