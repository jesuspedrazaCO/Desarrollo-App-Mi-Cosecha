const Expense = require('../models/Expense');
const Crop = require('../models/Crop');

// @desc    Listar gastos (filtrable por cultivo, categoría, rango de fechas)
// @route   GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const { crop, category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { owner: req.user._id };

    if (crop) query.crop = crop;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('crop', 'name type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      expenses,
      total,
      totalAmount: totalAmount[0]?.total || 0,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear gasto
// @route   POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    // Verificar que el cultivo pertenece al usuario
    const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const expense = await Expense.create({ ...req.body, owner: req.user._id });
    await expense.populate('crop', 'name type');
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar gasto
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    if (req.body.crop) {
      const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
      if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('crop', 'name type');

    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar gasto
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Gasto no encontrado.' });
    res.json({ message: 'Gasto eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
