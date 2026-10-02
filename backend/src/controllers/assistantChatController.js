import Crop from '../models/Crop.js'
import Expense from '../models/Expense.js'
import Income from '../models/Income.js'
import HouseholdExpense from '../models/HouseholdExpense.js'
import AssistantConversation from '../models/AssistantConversation.js'
import { sendAssistantMessage } from '../services/assistantChatService.js'
import { getWeatherForecast } from '../services/weatherService.js'

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

    const conversation = await AssistantConversation.findOne({ _id: req.params.id, user: req.user.id })
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' })
    }

    const userId = req.user.id

    const [crops, expenses, incomes, householdExpenses] = await Promise.all([
      Crop.find({ owner: userId }),
      Expense.find({ owner: userId }).sort({ date: -1 }).limit(150),
      Income.find({ owner: userId }).sort({ date: -1 }).limit(150),
      HouseholdExpense.find({ owner: userId }).sort({ date: -1 }).limit(150),
    ])

    const cropsContext = buildCropsContext(crops)
    const financialData = buildFinancialSummary({ crops, expenses, incomes, householdExpenses })
    const weather = await getWeatherForecast(req.user.lat, req.user.lng)

    const recentHistory = conversation.messages.slice(-20)

    const reply = await sendAssistantMessage({
      financialData,
      cropsContext,
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