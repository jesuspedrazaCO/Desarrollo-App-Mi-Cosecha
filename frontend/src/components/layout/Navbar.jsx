import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <header className="h-16 navbar-glass flex items-center justify-between px-4 md:px-8 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-150"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[13px] font-bold text-white/90 leading-tight">{user?.name}</p>
          <p className="text-[11px] text-white/40 leading-tight">{user?.farmName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-white/50 hover:text-white/90
            transition-colors duration-150 px-4 py-2 rounded-full hover:bg-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}
