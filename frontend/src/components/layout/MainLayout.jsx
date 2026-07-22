import { useState } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

// Rutas que ya tienen su propio acceso directo en la barra inferior
const BOTTOM_NAV_ROUTES = ['/', '/crops', '/asesor', '/reports']

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

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
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav onMoreClick={() => setSidebarOpen(true)} isMoreActive={isMoreActive} />
    </div>
  )
}