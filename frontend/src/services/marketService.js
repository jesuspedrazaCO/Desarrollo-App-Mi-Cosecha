import api from './api'
export const getMarketLists = (params) => api.get('/market/lists', { params })
export const getMarketListById = (id) => api.get(`/market/lists/${id}`)
export const createMarketList = (data) => api.post('/market/lists', data)
export const updateMarketList = (id, data) => api.put(`/market/lists/${id}`, data)
export const deleteMarketList = (id) => api.delete(`/market/lists/${id}`)
export const addMarketItem = (listId, data) => api.post(`/market/lists/${listId}/items`, data)
export const updateMarketItem = (id, data) => api.put(`/market/items/${id}`, data)
export const deleteMarketItem = (id) => api.delete(`/market/items/${id}`)
