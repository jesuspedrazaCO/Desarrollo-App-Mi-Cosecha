import Crop from "../models/Crop.js";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import HouseholdExpense from "../models/HouseholdExpense.js";
import AIConversation from "../models/AIConversation.js";
import { sendChatMessage } from "../services/aiChatService.js";

const buildFinancialSummary = ({ crops, expenses, incomes, householdExpenses }) => {
  const cropsSummary = crops.map((c) => ({
    nombre: c.name,
    estado: c.status,
    inversionTotal: c.totalExpenses ?? 0,
    ventasTotal: c.totalIncome ?? 0,
    rentabilidad: (c.totalIncome ?? 0) - (c.totalExpenses ?? 0),
  }));

  const gastosPorCategoria = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  return {
    cultivos: cropsSummary,
    totales: {
      gastosAgricolas: expenses.reduce((s, e) => s + (e.amount ?? 0), 0),
      ingresos: incomes.reduce((s, i) => s + (i.total ?? 0), 0),
      gastosHogar: householdExpenses.reduce((s, h) => s + (h.amount ?? 0), 0),
    },
    gastosPorCategoria,
  };
};

export const getConversation = async (req, res, next) => {
  try {
    let conversation = await AIConversation.findOne({ user: req.user.id }).sort({ updatedAt: -1 });
    if (!conversation) {
      conversation = await AIConversation.create({ user: req.user.id, messages: [] });
    }
    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

export const postMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "El mensaje no puede estar vacío" });
    }

    const conversation = await AIConversation.findOne({ _id: req.params.id, user: req.user.id });
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversación no encontrada" });
    }

    const userId = req.user.id;
    const [crops, expenses, incomes, householdExpenses] = await Promise.all([
      Crop.find({ user: userId }),
      Expense.find({ user: userId }).sort({ date: -1 }).limit(150),
      Income.find({ user: userId }).sort({ date: -1 }).limit(150),
      HouseholdExpense.find({ user: userId }).sort({ date: -1 }).limit(150),
    ]);

    const financialData = buildFinancialSummary({ crops, expenses, incomes, householdExpenses });

    // Limitamos historial a los últimos 20 mensajes para no pasarnos de contexto
    const recentHistory = conversation.messages.slice(-20);

    const reply = await sendChatMessage({
      financialData,
      history: recentHistory,
      newMessage: message,
    });

    conversation.messages.push({ role: "user", content: message });
    conversation.messages.push({ role: "assistant", content: reply });
    await conversation.save();

    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

export const startNewConversation = async (req, res, next) => {
  try {
    const conversation = await AIConversation.create({ user: req.user.id, messages: [] });
    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};