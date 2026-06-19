import api from './api'
export const getCrops = (params) => api.get('/crops', { params })
export const getCropById = (id) => api.get(`/crops/${id}`)
export const createCrop = (data) => api.post('/crops', data)
export const updateCrop = (id, data) => api.put(`/crops/${id}`, data)
export const deleteCrop = (id) => api.delete(`/crops/${id}`)
