const Crop = require('../models/Crop');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const HouseholdExpense = require('../models/HouseholdExpense');
const { calculateCropSummary, groupByMonth, groupByCategory } = require('../utils/financialCalculations');

// @desc    Comparación de rentabilidad entre cultivos
// @route   GET /api/reports/crops-comparison
const getCropsComparison = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const ownerId = req.user._id;

    const cropQuery = { owner: ownerId };
    if (status) cropQuery.status = status;
    const crops = await Crop.find(cropQuery);

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const comparison = await Promise.all(
      crops.map(async (crop) => {
        const expenseQuery = { owner: ownerId, crop: crop._id };
        const incomeQuery = { owner: ownerId, crop: crop._id };
        if (startDate || endDate) {
          expenseQuery.date = dateFilter;
          incomeQuery.date = dateFilter;
        }

        const expenses = await Expense.find(expenseQuery);
        const incomes = await Income.find(incomeQuery);

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

    res.json(comparison.sort((a, b) => b.netProfit - a.netProfit));
  } catch (error) {
    next(error);
  }
};

// @desc    Reporte de gastos agrícolas agrupados por categoría y por mes
// @route   GET /api/reports/agro-expenses
const getAgroExpensesReport = async (req, res, next) => {
  try {
    const { crop, startDate, endDate } = req.query;
    const query = { owner: req.user._id };
    if (crop) query.crop = crop;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).populate('crop', 'name type');

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = groupByCategory(expenses, 'category', 'amount');
    const byMonth = groupByMonth(expenses, 'amount');

    res.json({ total, byCategory, byMonth, count: expenses.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Reporte de ingresos agrícolas por mes
// @route   GET /api/reports/agro-income
const getAgroIncomeReport = async (req, res, next) => {
  try {
    const { crop, startDate, endDate } = req.query;
    const query = { owner: req.user._id };
    if (crop) query.crop = crop;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const incomes = await Income.find(query).populate('crop', 'name type');

    const total = incomes.reduce((sum, i) => sum + i.totalAmount, 0);
    const byMonth = groupByMonth(incomes, 'totalAmount');

    res.json({ total, byMonth, count: incomes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Reporte de gastos del hogar (mensual/anual, por categoría)
// @route   GET /api/reports/household
const getHouseholdReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { owner: req.user._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await HouseholdExpense.find(query);

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = groupByCategory(expenses, 'category', 'amount');
    const byMonth = groupByMonth(expenses, 'amount');

    res.json({ total, byCategory, byMonth, count: expenses.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCropsComparison,
  getAgroExpensesReport,
  getAgroIncomeReport,
  getHouseholdReport,
};
