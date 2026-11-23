import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: '14px',
              maxWidth: '400px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 8px 30px -8px rgba(45,111,67,0.25)',
            },
            success: { iconTheme: { primary: '#2d6f43', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// App instalable y disponible sin internet. Cuando sale una versión nueva se avisa y la persona decide.
const updateSW = registerSW({
  onNeedRefresh() {
    toast(
      (t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Hay una versión nueva
          <button
            type="button"
            onClick={() => { toast.dismiss(t.id); updateSW(true) }}
            style={{ background: '#2d6f43', color: '#fff', borderRadius: 10, padding: '4px 12px', fontWeight: 700 }}
          >
            Actualizar
          </button>
        </span>
      ),
      { id: 'pwa-update', duration: Infinity }
    )
  },
})