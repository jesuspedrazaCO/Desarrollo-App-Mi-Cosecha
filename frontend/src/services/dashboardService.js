import api from './api'
// scope: 'all' (todos los cultivos) | 'active' (solo los cultivos activos)
export const getDashboardStats = (scope = 'all') => api.get('/dashboard/stats', { params: { scope } })