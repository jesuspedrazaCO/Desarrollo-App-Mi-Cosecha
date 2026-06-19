import api from './api'

export const getReceipts = (params) => api.get('/receipts', { params })

export const uploadReceipt = (formData) =>
  api.post('/receipts', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const deleteReceipt = (id) => api.delete(`/receipts/${id}`)
