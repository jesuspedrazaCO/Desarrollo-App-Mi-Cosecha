const crypto = require('crypto');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Crop = require('../models/Crop');
const { PAYMENT_METHODS } = require('../models/Expense');

// Si vienen aportantes, verifica que la suma coincida con el valor total del gasto
// (con una pequeña tolerancia de centavos por redondeo). Si no hay aportantes, no valida nada.
const validatePayersSum = (payers, amount) => {
  if (!payers || payers.length === 0) return null;
  const sum = payers.reduce((s, p) => s + Number(p.amount || 0), 0);
  if (Math.abs(sum - Number(amount)) > 1) {
    return `La suma de los aportantes ($${sum.toLocaleString('es-CO')}) no coincide con el valor total del gasto ($${Number(amount).toLocaleString('es-CO')}).`;
  }
  return null;
};

// Normaliza fundedByCrop: '' o undefined se guardan como null (no financiado por otro cultivo)
const normalizeFundedByCrop = (value) => (value ? value : null);

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
      .populate('fundedByCrop', 'name type')
      .populate('payers.contributor', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    // aggregate() no convierte textos a ObjectId como sí hace find(). Sin esto, el filtro
    // por cultivo no coincide con ningún registro y el total sale siempre en $0.
    const matchQuery = { ...query };
    if (crop && mongoose.Types.ObjectId.isValid(crop)) matchQuery.crop = new mongoose.Types.ObjectId(crop);

    const totalAmount = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Cuánto de ese total todavía está por pagar
    const pendingAmount = await Expense.aggregate([
      { $match: { ...matchQuery, paymentStatus: 'pendiente' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      expenses,
      total,
      totalAmount: totalAmount[0]?.total || 0,
      pendingAmount: pendingAmount[0]?.total || 0,
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
    const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const payersError = validatePayersSum(req.body.payers, req.body.amount);
    if (payersError) return res.status(400).json({ message: payersError });

    const fundedByCrop = normalizeFundedByCrop(req.body.fundedByCrop);
    if (fundedByCrop) {
      const fundingCrop = await Crop.findOne({ _id: fundedByCrop, owner: req.user._id });
      if (!fundingCrop) return res.status(404).json({ message: 'El cultivo de origen de la plata no existe.' });
    }

    const expense = await Expense.create({ ...req.body, fundedByCrop, owner: req.user._id });
    await expense.populate('crop', 'name type');
    await expense.populate('fundedByCrop', 'name type');
    await expense.populate('payers.contributor', 'name');
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

    if (req.body.amount !== undefined) {
      const payersError = validatePayersSum(req.body.payers, req.body.amount);
      if (payersError) return res.status(400).json({ message: payersError });
    }

    const updateData = { ...req.body };
    if ('fundedByCrop' in req.body) {
      updateData.fundedByCrop = normalizeFundedByCrop(req.body.fundedByCrop);
      if (updateData.fundedByCrop) {
        const fundingCrop = await Crop.findOne({ _id: updateData.fundedByCrop, owner: req.user._id });
        if (!fundingCrop) return res.status(404).json({ message: 'El cultivo de origen de la plata no existe.' });
      }
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('crop', 'name type')
      .populate('fundedByCrop', 'name type')
      .populate('payers.contributor', 'name');

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

// ── Gastos por pagar ─────────────────────────────────────────────────────────
// Un gasto "por pagar" es un gasto normal del cultivo (cuenta en sus costos desde el primer día)
// con la etiqueta paymentStatus: 'pendiente'. Al pagarlo pasa a 'pagado' y la etiqueta desaparece.

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// @desc    Listar gastos por pagar (con totales)
// @route   GET /api/expenses/pending
const getPendingExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ owner: req.user._id, paymentStatus: 'pendiente' })
      .populate('crop', 'name type')
      .sort({ dueDate: 1, date: -1 });

    const today = startOfToday();
    const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const overdueCount = expenses.filter((e) => e.dueDate && e.dueDate < today).length;

    res.json({ expenses, count: expenses.length, totalAmount, overdueCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Registrar una compra por pagar (puede traer varios productos)
// @route   POST /api/expenses/pending
const createPendingOrder = async (req, res, next) => {
  try {
    const { supplier = '', date, dueDate, observations = '', items } = req.body;

    // Todos los cultivos de la compra deben ser del usuario
    const cropIds = [...new Set(items.map((i) => String(i.crop)))];
    const ownedCrops = await Crop.countDocuments({ _id: { $in: cropIds }, owner: req.user._id });
    if (ownedCrops !== cropIds.length) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const orderId = crypto.randomUUID();
    const created = await Expense.insertMany(
      items.map((item) => ({
        owner: req.user._id,
        crop: item.crop,
        date,
        description: item.description,
        category: item.category,
        amount: item.amount,
        paymentMethod: 'credito', // comprado a crédito, aún sin pagar
        observations,
        paymentStatus: 'pendiente',
        supplier,
        dueDate: dueDate || null,
        orderId,
      }))
    );
    res.status(201).json({ orderId, count: created.length, expenses: created });
  } catch (error) {
    next(error);
  }
};

const paymentData = (body) => ({
  paymentStatus: 'pagado',
  paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
  // Al pagar, el método ya no es "crédito": es con lo que se pagó de verdad
  paymentMethod: PAYMENT_METHODS.includes(body.paymentMethod) && body.paymentMethod !== 'credito' ? body.paymentMethod : 'efectivo',
});

// @desc    Marcar un gasto por pagar como pagado (cancelado)
// @route   PATCH /api/expenses/:id/pay
const payExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, paymentStatus: 'pendiente' },
      paymentData(req.body),
      { new: true, runValidators: true }
    ).populate('crop', 'name type');
    if (!expense) return res.status(404).json({ message: 'Gasto por pagar no encontrado.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Marcar como pagada toda una compra
// @route   POST /api/expenses/pending/order/:orderId/pay
const payOrder = async (req, res, next) => {
  try {
    const result = await Expense.updateMany(
      { owner: req.user._id, orderId: req.params.orderId, paymentStatus: 'pendiente' },
      paymentData(req.body)
    );
    if (!result.matchedCount) return res.status(404).json({ message: 'Compra por pagar no encontrada.' });
    res.json({ message: 'Compra marcada como pagada.', updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getPendingExpenses, createPendingOrder, payExpense, payOrder,
};