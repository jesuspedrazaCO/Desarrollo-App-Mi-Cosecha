import api from './api'
export const getExpenses = (params) => api.get('/expenses', { params })
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)

// Gastos por pagar
export const getPendingExpenses = () => api.get('/expenses/pending')
export const createPendingOrder = (data) => api.post('/expenses/pending', data)
export const payExpense = (id, data) => api.patch(`/expenses/${id}/pay`, data)
export const payOrder = (orderId, data) => api.post(`/expenses/pending/order/${orderId}/pay`, data)
