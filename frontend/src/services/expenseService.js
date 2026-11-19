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
// lineKey = lineId del producto (o el _id del gasto en compras viejas sin lineId)
export const updatePendingLine = (lineKey, data) => api.put(`/expenses/pending/line/${lineKey}`, data)
export const deletePendingLine = (lineKey) => api.delete(`/expenses/pending/line/${lineKey}`)
export const payLine = (lineKey, data) => api.post(`/expenses/pending/line/${lineKey}/pay`, data)