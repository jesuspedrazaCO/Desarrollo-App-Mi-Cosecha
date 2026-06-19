const Crop = require('../models/Crop');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const HouseholdExpense = require('../models/HouseholdExpense');
const CalendarEvent = require('../models/CalendarEvent');
const { calculateCropSummary } = require('../utils/financialCalculations');

// @desc    Resumen general del dashboard
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    // ── Cultivos activos ──
    const activeCrops = await Crop.find({ owner: ownerId, status: 'activo' });

    // ── Totales generales de cultivos ──
    const allExpenses = await Expense.find({ owner: ownerId });
    const allIncomes = await Income.find({ owner: ownerId });

    const totalInvested = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = allIncomes.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalProfit = totalIncome - totalInvested;

    // ── Resumen por cultivo activo ──
    const cropsSummary = await Promise.all(
      activeCrops.map(async (crop) => {
        const expenses = allExpenses.filter((e) => e.crop.toString() === crop._id.toString());
        const incomes = allIncomes.filter((i) => i.crop.toString() === crop._id.toString());
        const invested = expenses.reduce((sum, e) => sum + e.amount, 0);
        const sold = incomes.reduce((sum, i) => sum + i.totalAmount, 0);

        return {
          _id: crop._id,
          name: crop.name,
          type: crop.type,
          status: crop.status,
          ...calculateCropSummary(invested, sold),
        };
      })
    );

    // ── Gastos del hogar del mes actual ──
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const householdThisMonth = await HouseholdExpense.find({
      owner: ownerId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const householdTotalMonth = householdThisMonth.reduce((sum, e) => sum + e.amount, 0);

    // ── Próximos eventos / pagos pendientes (30 días) ──
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const future = new Date(today);
    future.setDate(future.getDate() + 30);

    const upcomingEvents = await CalendarEvent.find({
      owner: ownerId,
      date: { $gte: today, $lte: future },
      completed: false,
    })
      .populate('crop', 'name type')
      .sort({ date: 1 })
      .limit(8);

    const pendingPayments = upcomingEvents.filter((e) => e.type === 'pago_pendiente');

    // ── Alertas ──
    const alerts = [];
    pendingPayments.forEach((p) => {
      alerts.push({
        type: 'pago',
        message: `Pago pendiente: ${p.title}`,
        date: p.date,
        amount: p.amount,
      });
    });
    upcomingEvents
      .filter((e) => e.type === 'cosecha')
      .forEach((c) => {
        alerts.push({
          type: 'cosecha',
          message: `Cosecha próxima: ${c.title}`,
          date: c.date,
        });
      });

    res.json({
      summary: {
        totalInvested,
        totalIncome,
        totalProfit,
        activeCropsCount: activeCrops.length,
        householdTotalMonth,
      },
      cropsSummary,
      upcomingEvents,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
