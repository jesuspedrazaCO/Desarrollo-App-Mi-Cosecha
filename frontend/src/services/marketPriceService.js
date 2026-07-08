import api from './api'

// Precios guardados en MongoDB (seed inicial)
export const getMarketPrices = (params) => api.get('/market-prices', { params })
export const getMarketPriceSummary = () => api.get('/market-prices/summary')
export const getMarketPriceCategories = () => api.get('/market-prices/categories')

// Precios en tiempo real — llama a la función serverless de Vercel
export const fetchRealtimePrices = async (page = null) => {
  const url = page
    ? `/api/scrape-prices?page=${page}`
    : `/api/scrape-prices?all=true`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
