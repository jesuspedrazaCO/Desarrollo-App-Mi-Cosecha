import Crop from '../models/Crop.js'
import Expense from '../models/Expense.js'
import Income from '../models/Income.js'
import Application from '../models/Application.js'
import HouseholdExpense from '../models/HouseholdExpense.js'
import AssistantConversation from '../models/AssistantConversation.js'
import { sendAssistantMessage } from '../services/assistantChatService.js'
import { getWeatherForecast } from '../services/weatherService.js'
import { validateImagePayload } from '../utils/imagePayload.js'

const buildCropsContext = (crops) =>
  crops.map((c) => ({
    nombre: c.name,
    tipo: c.type,
    estado: c.status,
    fechaSiembra: c.startDate,
    cosechaEstimada: c.estimatedHarvestDate,
    ubicacion: c.location,
  }))

const buildFinancialSummary = ({ crops, expenses, incomes, householdExpenses }) => {
  const cropsSummary = crops.map((c) => {
    const cropExpenses = expenses.filter((e) => String(e.crop) === String(c._id))
    const cropIncomes = incomes.filter((i) => String(i.crop) === String(c._id))

    const inversionTotal = cropExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
    const ventasTotal = cropIncomes.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0)

    return {
      nombre: c.name,
      tipo: c.type,
      estado: c.status,
      inversionTotal,
      ventasTotal,
      rentabilidad: ventasTotal - inversionTotal,
    }
  })

  const gastosPorCategoria = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0)
    return acc
  }, {})

  const gastosHogarPorCategoria = householdExpenses.reduce((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + (h.amount ?? 0)
    return acc
  }, {})

  const totalGastosAgricolas = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const totalIngresos = incomes.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0)
  const totalGastosHogar = householdExpenses.reduce((sum, h) => sum + (h.amount ?? 0), 0)

  return {
    cultivos: cropsSummary,
    totales: {
      gastosAgricolas: totalGastosAgricolas,
      ingresos: totalIngresos,
      gastosHogar: totalGastosHogar,
      balanceNeto: totalIngresos - totalGastosAgricolas - totalGastosHogar,
    },
    gastosPorCategoria,
    gastosHogarPorCategoria,
  }
}

// Insumos y aplicaciones (abonos, fumigaciones, riego) agrupados por cultivo.
// Incluye el detalle de las más recientes y el total usado de cada producto.
// Los registros antiguos (un producto por registro) se leen igual que los nuevos.
const MAX_APPLICATIONS_PER_CROP = 20

const getApplicationLines = (a) => {
  if (Array.isArray(a.items) && a.items.length > 0) {
    return a.items.map((it) => ({ producto: it.product, cantidad: it.quantity, unidad: it.unit }))
  }
  if (a.product) return [{ producto: a.product, cantidad: a.quantity, unidad: a.unit }]
  return []
}

const buildApplicationsContext = (crops, applications) =>
  crops
    .map((c) => {
      const cropApps = applications.filter((a) => String(a.crop) === String(c._id))
      if (cropApps.length === 0) return null

      const totales = {}
      cropApps.forEach((a) => {
        getApplicationLines(a).forEach((l) => {
          const key = `${String(l.producto).trim().toLowerCase()}|${String(l.unidad || '').trim().toLowerCase()}`
          if (!totales[key]) totales[key] = { producto: l.producto, unidad: l.unidad, cantidadTotal: 0, aplicaciones: 0 }
          totales[key].cantidadTotal += Number(l.cantidad) || 0
          totales[key].aplicaciones += 1
        })
      })

      return {
        cultivo: c.name,
        tipo: c.type,
        totalPorProducto: Object.values(totales),
        aplicacionesRecientes: cropApps.slice(0, MAX_APPLICATIONS_PER_CROP).map((a) => ({
          fecha: a.date ? new Date(a.date).toISOString().slice(0, 10) : null,
          labor: a.type,
          caneca: a.tankVolume ? `${a.tankVolume} ${a.tankUnit || 'L'}` : null,
          canecasGastadas: a.tankCount > 1 ? a.tankCount : undefined,
          totalMezcla: a.tankVolume && a.tankCount > 1 ? `${a.tankVolume * a.tankCount} ${a.tankUnit || 'L'}` : undefined,
          productos: getApplicationLines(a),
          notas: a.observations || null,
        })),
      }
    })
    .filter(Boolean)

export const getAssistantConversation = async (req, res, next) => {
  try {
    let conversation = await AssistantConversation.findOne({ user: req.user.id }).sort({ updatedAt: -1 })
    if (!conversation) {
      conversation = await AssistantConversation.create({ user: req.user.id, messages: [] })
    }
    res.json({ success: true, data: conversation })
  } catch (err) {
    next(err)
  }
}

export const postAssistantMessage = async (req, res, next) => {
  try {
    const { message, imageBase64, imageMimeType } = req.body

    if (!message?.trim() && !imageBase64) {
      return res.status(400).json({ success: false, message: 'Escribe un mensaje o adjunta una foto' })
    }

    const imageError = validateImagePayload(imageBase64, imageMimeType)
    if (imageError) return res.status(400).json({ success: false, message: imageError })

    const conversation = await AssistantConversation.findOne({ _id: req.params.id, user: req.user.id })
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' })
    }

    const userId = req.user.id

    const [crops, expenses, incomes, householdExpenses, applications] = await Promise.all([
      Crop.find({ owner: userId }),
      Expense.find({ owner: userId }).sort({ date: -1 }).limit(150),
      Income.find({ owner: userId }).sort({ date: -1 }).limit(150),
      HouseholdExpense.find({ owner: userId }).sort({ date: -1 }).limit(150),
      Application.find({ owner: userId }).sort({ date: -1 }).limit(150),
    ])

    const cropsContext = buildCropsContext(crops)
    const financialData = buildFinancialSummary({ crops, expenses, incomes, householdExpenses })
    const applicationsContext = buildApplicationsContext(crops, applications)
    const weather = await getWeatherForecast(req.user.lat, req.user.lng)

    const recentHistory = conversation.messages.slice(-20)

    const reply = await sendAssistantMessage({
      financialData,
      cropsContext,
      applicationsContext,
      weather,
      history: recentHistory,
      newMessage: message || '',
      imageBase64,
      imageMimeType,
    })

    const userContent = imageBase64
      ? `📷 ${message?.trim() ? message : '[Foto enviada para diagnóstico]'}`
      : message

    conversation.messages.push({ role: 'user', content: userContent })
    conversation.messages.push({ role: 'assistant', content: reply })
    await conversation.save()

    res.json({ success: true, data: conversation })
  } catch (err) {
    next(err)
  }
}

export const startNewAssistantConversation = async (req, res, next) => {
  try {
    const conversation = await AssistantConversation.create({ user: req.user.id, messages: [] })
    res.json({ success: true, data: conversation })
  } catch (err) {
    next(err)
  }
}