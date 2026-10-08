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

// Trae TODOS los productos disponibles (de la base de datos primero, o en
// tiempo real al pedirlo) y los deja en memoria tal cual. El filtrado por
// texto o categoría ya NO pasa por aquí — se hace del lado del componente,
// sobre esta misma lista, sin volver a pedir nada al servidor. Antes, cada
// cambio de filtro disparaba una nueva consulta a MongoDB (que está vacía
// mientras no se siembre), y esa respuesta vacía borraba los productos que
// ya estaban cargados en tiempo real.
export const useMarketPrices = () => {
  const [prices, setPrices] = useState([])
  const [total, setTotal] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isRealtime, setIsRealtime] = useState(false)

  // Cargar precios guardados en MongoDB — rápido, pero puede venir vacío
  // si nunca se ha sembrado la base de datos.
  const fetchFromDB = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMarketPrices({ limit: 500 })
      setPrices(res.data.prices)
      setTotal(res.data.total)
      setLastUpdated(res.data.lastUpdated)
      setIsRealtime(false)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar con datos en tiempo real — tarda unos segundos
  const refreshRealtime = useCallback(async () => {
    setRefreshing(true)
    const toastId = toast.loading('Consultando precios actuales de Centroabastos...')
    try {
      const data = await fetchRealtimePrices()
      if (data.success && data.products.length > 0) {
        setPrices(data.products)
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
  }, [])

  useEffect(() => { fetchFromDB() }, [fetchFromDB])

  return {
    prices, total, lastUpdated, loading, refreshing, isRealtime,
    refetch: fetchFromDB, refreshRealtime,
  }
}