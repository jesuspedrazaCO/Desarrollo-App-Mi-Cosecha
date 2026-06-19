import { useState, useEffect } from 'react'
import { getDashboardStats } from '../services/dashboardService'
import toast from 'react-hot-toast'

export const useDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDashboardStats()
        setData(res.data)
      } catch {
        toast.error('Error al cargar el panel principal')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading }
}