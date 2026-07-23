import api from './api'

export const createPlantingPlot = (data) => api.post('/planting-plots', data)
export const getPlantingPlots = () => api.get('/planting-plots')
export const deletePlantingPlot = (id) => api.delete(`/planting-plots/${id}`)