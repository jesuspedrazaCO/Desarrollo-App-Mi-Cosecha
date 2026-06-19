import api from './api'
export const getEvents = (params) => api.get('/calendar', { params })
export const getUpcomingEvents = () => api.get('/calendar/upcoming')
export const createEvent = (data) => api.post('/calendar', data)
export const updateEvent = (id, data) => api.put(`/calendar/${id}`, data)
export const deleteEvent = (id) => api.delete(`/calendar/${id}`)
