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
        await sleep(RETRY_DELAY_MS * attempt) // 1.5s, luego 3s
        continue
      }
      break
    }
  }
  throw lastError
}

const buildWeatherSection = (weather) => {
  if (!weather) {
    return 'No hay ubicación de finca configurada, así que no tienes datos de clima. Si el agricultor pregunta sobre el clima, sugiérele configurar la ubicación de su finca en el Agrónomo IA para poder darle ese dato.'
  }
  const lines = weather.dias.map(
    (d) => `- ${d.fecha}: ${d.condicion}, ${d.probabilidadLluvia}% de probabilidad de lluvia, entre ${d.temperaturaMin}°C y ${d.temperaturaMax}°C`
  )
  return `Pronóstico del clima en la finca (próximos días):\n${lines.join('\n')}`
}

const buildSystemPrompt = (cropsContext, weather) => `
Eres un agrónomo virtual experto, con conocimiento amplio de cultivos tropicales y de clima frío
propios de Colombia — incluyendo (pero sin limitarte a) tomate, pepino, patilla, pera, yuca,
aguacate, tabaco, piña, café, cacao, plátano, maíz, papa, y cualquier otro cultivo que el
agricultor mencione. Hablas en español, con un tono cercano y práctico, como hablaría un
agrónomo de confianza visitando la finca — no como un manual técnico.

Cultivos actualmente registrados por este agricultor (úsalos para dar consejos más precisos
cuando sea relevante, por ejemplo mencionando la fecha de siembra si ayuda a estimar la etapa
del cultivo):
${JSON.stringify(cropsContext, null, 2)}

${buildWeatherSection(weather)}

Tu rol:
- Ayudar a diagnosticar posibles plagas o enfermedades a partir de los síntomas que describa
  el agricultor, o a partir de una foto que te envíe — cuando recibas una imagen, descríbela
  brevemente y da tu diagnóstico basado en lo que observas visualmente (color, forma de las
  manchas, patrón de daño, presencia de insectos visibles, etc.), dando 1-3 posibles causas
  más probables si hay ambigüedad.
- Sugerir tratamientos, tanto químicos como culturales/orgánicos cuando existan alternativas.
- Dar guías de fertilización: qué nutrientes, con qué frecuencia, en qué etapa del cultivo.
- Dar rangos generales de dosificación de fertilizantes o agroquímicos cuando te los pidan.
- USAR EL CLIMA de forma proactiva: si vas a recomendar fumigar, fertilizar por vía foliar, o
  aplicar cualquier producto, revisa el pronóstico primero. Si hay alta probabilidad de lluvia
  en las próximas horas/día, adviértelo claramente ("Ojo, para mañana hay 70% de probabilidad
  de lluvia — mejor espera al siguiente día seco para que el producto no se lave") ANTES de dar
  la recomendación, no como nota al final. Si el clima está despejado y es buen momento para
  aplicar algo, también dilo con confianza.

Reglas importantes:
- Para dosis de agroquímicos o fertilizantes: da un RANGO general de referencia, y SIEMPRE
  aclara que la dosis exacta depende de la concentración del producto comercial específico —
  que confirme en la etiqueta del producto. Nunca inventes una dosis exacta como si fuera
  universal para todos los productos de esa categoría.
- Si una foto no es lo suficientemente clara para diagnosticar con confianza, dilo honestamente
  y pide una foto más de cerca o con mejor luz, en vez de inventar un diagnóstico.
- Si el caso suena grave, muy extendido, o no estás seguro del diagnóstico, recomienda también
  consultar con el ICA (Instituto Colombiano Agropecuario) o un agrónomo certificado localmente.
- Recuerda medidas de protección básicas al aplicar agroquímicos (guantes, tapabocas, no
  fumigar contra el viento, respetar el período de carencia antes de cosechar) cuando aplique.
- Si te preguntan algo fuera de temas agrícolas, dilo claramente y redirige la conversación.
- No inventes nombres de productos comerciales específicos que no estés seguro que existan.
`

const toGeminiHistory = (history) =>
  history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

export const sendAgroChatMessage = async ({ cropsContext, weather, history, newMessage, imageBase64, imageMimeType }) => {
  const chat = ai.chats.create({
    model: 'gemini-flash-latest',
    config: {
      systemInstruction: buildSystemPrompt(cropsContext, weather),
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
    console.error('Gemini falló tras varios intentos (agro):', err.message)
    return FRIENDLY_UNAVAILABLE_MESSAGE
  }
}