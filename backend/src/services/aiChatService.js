import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1500

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isRetryableError = (err) => {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('503') || msg.includes('unavailable') || msg.includes('overloaded') || msg.includes('high demand')
}

const FRIENDLY_UNAVAILABLE_MESSAGE =
  'Uy, justo ahora el servicio de IA está muy solicitado 🙏 (al ser un plan gratuito, a veces pasa en horas pico). ' +
  'Ya lo intenté varias veces sin suerte — dame un par de minutos y vuelve a preguntarme, seguro ya estará disponible. ' +
  '¡Gracias por la paciencia mientras seguimos mejorando esto!'

const sendWithRetry = async (chat, message) => {
  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await chat.sendMessage({ message })
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await sleep(RETRY_DELAY_MS * attempt) // 1.5s, luego 3s
        continue
      }
      break
    }
  }
  throw lastError
}

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
`

const toGeminiHistory = (history) =>
  history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

export const sendChatMessage = async ({ financialData, history, newMessage }) => {
  const chat = ai.chats.create({
    model: 'gemini-flash-latest',
    config: {
      systemInstruction: buildSystemPrompt(financialData),
    },
    history: toGeminiHistory(history),
  })

  try {
    const response = await sendWithRetry(chat, newMessage)
    return response.text.trim()
  } catch (err) {
    console.error('Gemini falló tras varios intentos (asesor):', err.message)
    return FRIENDLY_UNAVAILABLE_MESSAGE
  }
}