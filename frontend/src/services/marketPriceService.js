import api from './api'
export const getMarketPrices = (params) => api.get('/market-prices', { params })
export const getMarketPriceSummary = () => api.get('/market-prices/summary')
export const getMarketPriceCategories = () => api.get('/market-prices/categories')
