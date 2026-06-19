import api from './api'
export const getCropsComparison = (params) => api.get('/reports/crops-comparison', { params })
export const getAgroExpensesReport = (params) => api.get('/reports/agro-expenses', { params })
export const getAgroIncomeReport = (params) => api.get('/reports/agro-income', { params })
export const getHouseholdReport = (params) => api.get('/reports/household', { params })
