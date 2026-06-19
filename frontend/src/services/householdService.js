import api from './api'
export const getHouseholdExpenses = (params) => api.get('/household', { params })
export const createHouseholdExpense = (data) => api.post('/household', data)
export const updateHouseholdExpense = (id, data) => api.put(`/household/${id}`, data)
export const deleteHouseholdExpense = (id) => api.delete(`/household/${id}`)
