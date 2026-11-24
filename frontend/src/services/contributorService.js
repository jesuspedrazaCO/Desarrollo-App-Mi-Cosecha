import api from './api'

export const getContributors = () => api.get('/contributors')
export const createContributor = (name) => api.post('/contributors', { name })
export const deleteContributor = (id) => api.delete(`/contributors/${id}`)
// scope: 'all' (todos los cultivos) | 'active' (solo los cultivos activos)
export const getFarmWideContributorSummary = (scope = 'all') => api.get('/contributors/summary/farm', { params: { scope } })
export const getCropContributorSummary = (cropId) => api.get(`/contributors/summary/crop/${cropId}`)
export const getContributorDetail = (id, scope = 'all') => api.get(`/contributors/summary/contributor/${id}`, { params: { scope } })