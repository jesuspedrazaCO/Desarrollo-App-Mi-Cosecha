import { useState, useEffect, useCallback } from 'react'
import { getMarketPrices, getMarketPriceSummary, fetchRealtimePrices } from '../services/marketPriceService'
import toast from 'react-hot-toast'

export const useMarketPriceSummary = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMarketPriceSummary()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}

export const useMarketPrices = (initialParams = {}) => {
  const [prices, setPrices] = useState([])
  const [total, setTotal] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isRealtime, setIsRealtime] = useState(false)
  const [params, setParams] = useState(initialParams)

  // Cargar precios del seed (MongoDB) — rápido
  const fetchFromDB = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMarketPrices({ ...params, limit: 500 })
      setPrices(res.data.prices)
      setTotal(res.data.total)
      setLastUpdated(res.data.lastUpdated)
      setIsRealtime(false)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [params])

  // Actualizar con datos en tiempo real — tarda ~20-30s
  const refreshRealtime = useCallback(async () => {
    setRefreshing(true)
    const toastId = toast.loading('Consultando precios actuales de Centroabastos...')
    try {
      const data = await fetchRealtimePrices()
      if (data.success && data.products.length > 0) {
        // Filtrar por búsqueda/categoría si hay params activos
        let filtered = data.products
        if (params.search) {
          filtered = filtered.filter(p =>
            p.product.toLowerCase().includes(params.search.toLowerCase())
          )
        }
        if (params.category) {
          filtered = filtered.filter(p => p.category === params.category)
        }
        setPrices(filtered)
        setTotal(data.total)
        setLastUpdated(data.lastUpdated)
        setIsRealtime(true)
        toast.success(`${data.total} productos actualizados en tiempo real`, { id: toastId })
      } else {
        toast.error('No se pudieron obtener datos en tiempo real', { id: toastId })
      }
    } catch (err) {
      toast.error('Error al consultar Centroabastos', { id: toastId })
    } finally {
      setRefreshing(false)
    }
  }, [params])

  useEffect(() => { fetchFromDB() }, [fetchFromDB])

  return {
    prices, total, lastUpdated, loading, refreshing, isRealtime,
    params, setParams, refetch: fetchFromDB, refreshRealtime,
  }
}
