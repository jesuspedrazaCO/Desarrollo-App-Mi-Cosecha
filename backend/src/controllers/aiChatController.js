import Crop from "../models/Crop.js";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import HouseholdExpense from "../models/HouseholdExpense.js";
import AIConversation from "../models/AIConversation.js";
import { sendChatMessage } from "../services/aiChatService.js";

const buildFinancialSummary = ({ crops, expenses, incomes, householdExpenses }) => {
  // Calculamos inversión y ventas por cultivo sumando sus gastos e ingresos asociados
  const cropsSummary = crops.map((c) => {
    const cropExpenses = expenses.filter((e) => String(e.crop) === String(c._id));
    const cropIncomes = incomes.filter((i) => String(i.crop) === String(c._id));

    const inversionTotal = cropExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
    const ventasTotal = cropIncomes.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);

    return {
      nombre: c.name,
      tipo: c.type,
      estado: c.status,
      inversionTotal,
      ventasTotal,
      rentabilidad: ventasTotal - inversionTotal,
    };
  });

  const gastosPorCategoria = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  const gastosHogarPorCategoria = householdExpenses.reduce((acc, h) => {
    acc[h.category] = (acc[h.category] ?? 0) + (h.amount ?? 0);
    return acc;
  }, {});

  const totalGastosAgricolas = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const totalIngresos = incomes.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0);
  const totalGastosHogar = householdExpenses.reduce((sum, h) => sum + (h.amount ?? 0), 0);

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

    // ⚠️ Los modelos Crop/Expense/Income/HouseholdExpense usan "owner", no "user"
    const [crops, expenses, incomes, householdExpenses] = await Promise.all([
      Crop.find({ owner: userId }),
      Expense.find({ owner: userId }).sort({ date: -1 }).limit(150),
      Income.find({ owner: userId }).sort({ date: -1 }).limit(150),
      HouseholdExpense.find({ owner: userId }).sort({ date: -1 }).limit(150),
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