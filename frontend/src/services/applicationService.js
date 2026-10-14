import api from './api'
export const getApplications = (params) => api.get('/applications', { params })
export const getApplicationSummary = (crop) => api.get('/applications/summary', { params: { crop } })
export const createApplication = (data) => api.post('/applications', data)
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data)
export const deleteApplication = (id) => api.delete(`/applications/${id}`)