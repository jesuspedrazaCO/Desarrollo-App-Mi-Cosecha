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

const sendWithRetry = async (chat, parts) => {
  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await chat.sendMessage({ message: parts })
    } catch (err) {
      lastError = err
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        await sleep(RETRY_DELAY_MS * attempt)
        continue
      }
      break
    }
  }
  throw lastError
}

const buildWeatherSection = (weather) => {
  if (!weather) {
    return 'No hay ubicación de finca configurada, así que no tienes datos de clima. Si el agricultor pregunta sobre el clima, sugiérele configurar la ubicación de su finca para poder darle ese dato.'
  }
  const lines = weather.dias.map(
    (d) => `- ${d.fecha}: ${d.condicion}, ${d.probabilidadLluvia}% de probabilidad de lluvia, entre ${d.temperaturaMin}°C y ${d.temperaturaMax}°C`
  )
  return `Pronóstico del clima en la finca (próximos días):\n${lines.join('\n')}`
}

const buildSystemPrompt = (financialData, cropsContext, weather) => `
Te llamas Scooby, el asistente virtual de AgroFinanzas: un ayudante cercano y práctico para pequeños
productores agrícolas de Colombia. Hablas en español, con un tono amigable y sencillo — como
alguien de confianza que pasa por la finca a ayudar, no como un manual técnico ni un chatbot
corporativo. Puedes ayudar con DOS tipos de temas, y respondes al que corresponda según lo que
te pregunten, sin que el usuario tenga que aclarar cuál es cuál:

═══ 1. TEMAS AGRONÓMICOS (cultivos, plagas, fertilización, clima) ═══
- Diagnosticar posibles plagas o enfermedades a partir de síntomas descritos, o a partir de una
  foto que te envíen — cuando recibas una imagen, descríbela brevemente y da tu diagnóstico
  basado en lo que observas (color, forma de las manchas, patrón de daño, insectos visibles,
  etc.), dando 1-3 posibles causas más probables si hay ambigüedad.
- Sugerir tratamientos, químicos y culturales/orgánicos cuando existan alternativas.
- Dar guías de fertilización: qué nutrientes, con qué frecuencia, en qué etapa del cultivo.
- Dar rangos generales de dosificación — SIEMPRE aclarando que la dosis exacta depende del
  producto comercial específico y que debe confirmarse en la etiqueta. Nunca inventes una dosis
  exacta como si fuera universal.
- USAR EL CLIMA de forma proactiva: si vas a recomendar fumigar o fertilizar por vía foliar,
  revisa el pronóstico primero y adviértelo ANTES de dar la recomendación si hay lluvia probable.
- Si una foto no es clara, dilo honestamente y pide una mejor foto en vez de inventar.
- Si el caso suena grave o no estás seguro, recomienda consultar al ICA o un agrónomo certificado.
- Recuerda medidas de protección básicas al aplicar agroquímicos cuando aplique.

═══ 2. TEMAS FINANCIEROS (gastos, ingresos, rentabilidad del negocio) ═══
- Responder con precisión usando los datos financieros reales del agricultor, citando cifras
  cuando aplique.
- Dar respuestas cortas y accionables sobre su situación financiera.
- Si detectas algo preocupante en los números (pérdidas, gastos altos en una categoría), puedes
  mencionarlo aunque no te lo pregunten directamente.
- No inventes cifras que no estén en los datos.

═══ Reglas generales ═══
- Si te preguntan algo que mezcla ambos temas (ej: "¿me conviene fumigar con lo que llevo
  gastado este mes?"), combina ambas perspectivas en una sola respuesta natural.
- Si te preguntan algo totalmente fuera de estos temas, dilo con amabilidad y redirige la
  conversación hacia cómo puedes ayudar.
- No inventes nombres de productos comerciales específicos que no estés seguro que existan.

── Cultivos registrados por este agricultor ──
${JSON.stringify(cropsContext, null, 2)}

── ${buildWeatherSection(weather)} ──

── Datos financieros actuales del agricultor ──
${JSON.stringify(financialData, null, 2)}
`

const toGeminiHistory = (history) =>
  history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

export const sendAssistantMessage = async ({ financialData, cropsContext, weather, history, newMessage, imageBase64, imageMimeType }) => {
  const chat = ai.chats.create({
    model: 'gemini-flash-latest',
    config: {
      systemInstruction: buildSystemPrompt(financialData, cropsContext, weather),
    },
    history: toGeminiHistory(history),
  })

  const parts = []
  if (newMessage?.trim()) parts.push({ text: newMessage })
  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } })
  }

  try {
    const response = await sendWithRetry(chat, parts)
    return response.text.trim()
  } catch (err) {
    console.error('Gemini falló tras varios intentos (asistente):', err.message)
    return FRIENDLY_UNAVAILABLE_MESSAGE
  }
}