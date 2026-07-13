import api from "./api";
// ⚠️ Ajusta el import si tu instancia de axios no se llama "api" o está en otra ruta

export const getConversation = () => api.get("/ai/conversation");
export const startNewConversation = () => api.post("/ai/conversation/new");
export const sendMessage = (conversationId, message) =>
  api.post(`/ai/conversation/${conversationId}/message`, { message });