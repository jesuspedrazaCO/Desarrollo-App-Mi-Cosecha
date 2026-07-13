import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const buildSystemPrompt = (financialData) => `
Eres un asesor financiero agrícola experto, hablando con un pequeño productor de Santander, Colombia.
Tu tono es cercano, claro y práctico — nada de tecnicismos innecesarios. Responde en español.

Aquí tienes los datos financieros actuales del agricultor (úsalos para responder con precisión, citando números reales cuando aplique):
${JSON.stringify(financialData, null, 2)}

Reglas:
- Si te preguntan algo que no puedes calcular con estos datos, dilo claramente.
- Da respuestas cortas y accionables, como hablaría un asesor de confianza, no un robot corporativo.
- Si detectas algo preocupante en los números (pérdidas, gastos altos), puedes mencionarlo aunque no te lo pregunten directamente.
- No inventes cifras que no estén en los datos.
`;

const toGeminiHistory = (history) =>
  history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

export const sendChatMessage = async ({ financialData, history, newMessage }) => {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: buildSystemPrompt(financialData),
    },
    history: toGeminiHistory(history),
  });

  const response = await chat.sendMessage({ message: newMessage });

  return response.text.trim();
};