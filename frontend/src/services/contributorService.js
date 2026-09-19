import api from './api'

export const getContributors = () => api.get('/contributors')
export const createContributor = (name) => api.post('/contributors', { name })
export const deleteContributor = (id) => api.delete(`/contributors/${id}`)
export const getFarmWideContributorSummary = () => api.get('/contributors/summary/farm')
export const getCropContributorSummary = (cropId) => api.get(`/contributors/summary/crop/${cropId}`)