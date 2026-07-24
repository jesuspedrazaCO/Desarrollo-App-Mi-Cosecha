import api from './api'

export const getAgroConversation = () => api.get('/agro/conversation')
export const startNewAgroConversation = () => api.post('/agro/conversation/new')
export const sendAgroMessage = (conversationId, message) =>
  api.post(`/agro/conversation/${conversationId}/message`, { message })