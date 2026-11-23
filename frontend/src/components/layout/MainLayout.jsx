import { useState } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import OfflineBanner from '../common/OfflineBanner'

// Rutas que ya tienen su propio acceso directo en la barra inferior
const BOTTOM_NAV_ROUTES = ['/', '/crops', '/reports']

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, isViewer } = useAuth()

  const isMoreActive = sidebarOpen || !BOTTOM_NAV_ROUTES.includes(location.pathname)

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-primary-900/30 backdrop-blur-sm z-20 lg:hidden animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <OfflineBanner />
            {isViewer && (
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-xs"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.30)', color: 'rgba(253,230,138,0.95)' }}>
                <Eye size={15} className="flex-shrink-0 mt-px" />
                <span>
                  Estás viendo <strong>{user?.farmName || 'la finca'}</strong> en modo lectura: puedes consultar todo y descargar PDF,
                  pero no registrar, editar ni borrar datos.
                </span>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav onMoreClick={() => setSidebarOpen(true)} isMoreActive={isMoreActive} />
    </div>
  )
}