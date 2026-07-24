import Crop from '../models/Crop.js'
import AgroConversation from '../models/AgroConversation.js'
import { sendAgroChatMessage } from '../services/agroChatService.js'

const buildCropsContext = (crops) =>
  crops.map((c) => ({
    nombre: c.name,
    tipo: c.type,
    estado: c.status,
    fechaSiembra: c.startDate,
    cosechaEstimada: c.estimatedHarvestDate,
    ubicacion: c.location,
  }))

export const getAgroConversation = async (req, res, next) => {
  try {
    let conversation = await AgroConversation.findOne({ user: req.user.id }).sort({ updatedAt: -1 })
    if (!conversation) {
      conversation = await AgroConversation.create({ user: req.user.id, messages: [] })
    }
    res.json({ success: true, data: conversation })
  } catch (err) {
    next(err)
  }
}

export const postAgroMessage = async (req, res, next) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío' })
    }

    const conversation = await AgroConversation.findOne({ _id: req.params.id, user: req.user.id })
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' })
    }

    // ⚠️ El modelo Crop usa "owner", no "user"
    const crops = await Crop.find({ owner: req.user.id })
    const cropsContext = buildCropsContext(crops)

    const recentHistory = conversation.messages.slice(-20)

    const reply = await sendAgroChatMessage({
      cropsContext,
      history: recentHistory,
      newMessage: message,
    })

    conversation.messages.push({ role: 'user', content: message })
    conversation.messages.push({ role: 'assistant', content: reply })
    await conversation.save()

    res.json({ success: true, data: conversation })
  } catch (err) {
    next(err)
  }
}

export const startNewAgroConversation = async (req, res, next) => {
  try {
    const conversation = await AgroConversation.create({ user: req.user.id, messages: [] })
    res.json({ success: true, data: conversation })
  } catch (err) {
    next(err)
  }
}