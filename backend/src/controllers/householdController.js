const HouseholdExpense = require('../models/HouseholdExpense');
const { groupByMonth, groupByCategory } = require('../utils/financialCalculations');

// @desc    Listar gastos del hogar (filtrable por categoría y rango de fechas)
// @route   GET /api/household
const getHouseholdExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { owner: req.user._id };

    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await HouseholdExpense.countDocuments(query);
    const items = await HouseholdExpense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const allForSummary = await HouseholdExpense.find(query);
    const totalAmount = allForSummary.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = groupByCategory(allForSummary, 'category', 'amount');
    const byMonth = groupByMonth(allForSummary, 'amount');

    res.json({
      items,
      total,
      totalAmount,
      byCategory,
      byMonth,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear gasto del hogar
// @route   POST /api/household
const createHouseholdExpense = async (req, res, next) => {
  try {
    const expense = await HouseholdExpense.create({ ...req.body, owner: req.user._id });
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar gasto del hogar
// @route   PUT /api/household/:id
const updateHouseholdExpense = async (req, res, next) => {
  try {
    const expense = await HouseholdExpense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar gasto del hogar
// @route   DELETE /api/household/:id
const deleteHouseholdExpense = async (req, res, next) => {
  try {
    const expense = await HouseholdExpense.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });
    res.json({ message: 'Gasto eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHouseholdExpenses, createHouseholdExpense, updateHouseholdExpense, deleteHouseholdExpense };
