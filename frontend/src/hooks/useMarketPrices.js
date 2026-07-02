import { useState, useEffect, useCallback } from 'react'
import { getMarketPrices, getMarketPriceSummary } from '../services/marketPriceService'

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
  const [params, setParams] = useState(initialParams)

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMarketPrices(params)
      setPrices(res.data.prices)
      setTotal(res.data.total)
      setLastUpdated(res.data.lastUpdated)
    } catch {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  return { prices, total, lastUpdated, loading, params, setParams, refetch: fetchPrices }
}
