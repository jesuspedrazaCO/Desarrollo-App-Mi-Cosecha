import { useState, useEffect } from 'react'
import { getDashboardStats } from '../services/dashboardService'
import toast from 'react-hot-toast'

// scope: 'all' | 'active'. Al cambiarlo se conservan los datos anteriores mientras llegan los nuevos.
export const useDashboard = (scope = 'all') => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    let active = true

    const fetch = async (silent = false) => {
      try {
        const res = await getDashboardStats(scope)
        if (active) setData(res.data)
      } catch {
        if (!silent) toast.error('Error al cargar el panel principal')
      } finally {
        if (active) { setLoading(false); setSwitching(false) }
      }
    }
    setSwitching(true)
    fetch()

    // Si la app se queda abierta en segundo plano (muy común en el celular) y se
    // vuelve a ella, se refrescan los totales sin tener que recargar la página.
    const refreshOnReturn = () => {
      if (document.visibilityState === 'visible') fetch(true)
    }
    document.addEventListener('visibilitychange', refreshOnReturn)
    window.addEventListener('focus', refreshOnReturn)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', refreshOnReturn)
      window.removeEventListener('focus', refreshOnReturn)
    }
  }, [scope])

  return { data, loading, switching }
}