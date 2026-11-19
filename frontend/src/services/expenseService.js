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

// Editar / eliminar / agregar en compras por pagar
// orderKey = orderId de la compra (o el _id del producto en compras viejas sin orderId)
export const addPendingItems = (orderKey, items) => api.post(`/expenses/pending/order/${orderKey}/items`, { items })
export const updatePendingOrder = (orderKey, data) => api.put(`/expenses/pending/order/${orderKey}`, data)
export const deletePendingOrder = (orderKey) => api.delete(`/expenses/pending/order/${orderKey}`)
export const updatePendingItem = (id, data) => api.put(`/expenses/pending/item/${id}`, data)
export const deletePendingItem = (id) => api.delete(`/expenses/pending/item/${id}`)