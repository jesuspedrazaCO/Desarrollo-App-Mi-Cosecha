import api from './api'

export const getAssistantConversation = () => api.get('/assistant/conversation')
export const startNewAssistantConversation = () => api.post('/assistant/conversation/new')

export const sendAssistantMessage = (conversationId, message, imageBase64 = null, imageMimeType = null) =>
  api.post(`/assistant/conversation/${conversationId}/message`, { message, imageBase64, imageMimeType })