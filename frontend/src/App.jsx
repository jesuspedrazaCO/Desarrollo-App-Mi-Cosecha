import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import MainLayout from './components/layout/MainLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CropsPage from './pages/CropsPage'
import CropDetailPage from './pages/CropDetailPage'
import HouseholdPage from './pages/HouseholdPage'
import MarketListsPage from './pages/MarketListsPage'
import MarketListDetailPage from './pages/MarketListDetailPage'
import ReceiptsPage from './pages/ReceiptsPage'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import MarketPricesPage from './pages/MarketPricesPage'
import NotFoundPage from './pages/NotFoundPage'
import Asesor from "./pages/Asesor";
import PlantingCalculatorPage from './pages/PlantingCalculatorPage'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1c10' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Cargando AgroFinanzas...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />
      <Route path="/asesor" element={<Asesor />} />


      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/crops" element={<CropsPage />} />
          <Route path="/crops/:id" element={<CropDetailPage />} />
          <Route path="/household" element={<HouseholdPage />} />
          <Route path="/market" element={<MarketListsPage />} />
          <Route path="/market/:id" element={<MarketListDetailPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/market-prices" element={<MarketPricesPage />} />
          <Route path="/planting-calculator" element={<PlantingCalculatorPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
