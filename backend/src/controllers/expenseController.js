const crypto = require('crypto');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Crop = require('../models/Crop');
const { PAYMENT_METHODS } = require('../models/Expense');
const Receipt = require('../models/Receipt');

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

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v));
const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v)) && /^[a-f\d]{24}$/i.test(String(v));
const roundMoney = (n) => Math.round(n * 100) / 100;
const MAX_ITEMS_PER_ORDER = 50;

// Arma los campos de un producto (cantidad, unidad, precio unitario y valor total) a partir de lo
// que manda el cliente. El total SIEMPRE lo calcula el servidor: si vienen cantidad y precio
// unitario, amount = cantidad × precio; si no, se usa el amount recibido (compras sencillas).
// Devuelve null si el producto no tiene un valor válido.
const buildItemFields = (item) => {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);
  const unit = String(item.unit || '').trim().slice(0, 20);
  if (quantity > 0 && unitPrice > 0) {
    const amount = roundMoney(quantity * unitPrice);
    if (!(amount > 0)) return null;
    return { quantity, unitPrice, unit: unit || 'unidad', amount };
  }
  const amount = Number(item.amount);
  if (!(amount > 0)) return null;
  return { quantity: null, unitPrice: null, unit: '', amount };
};

// Todos los cultivos que vengan deben ser del usuario
const cropsAreOwned = async (ownerId, items) => {
  const cropIds = [...new Set(items.filter((i) => i.crop).map((i) => String(i.crop)))];
  if (!cropIds.length) return true;
  const owned = await Crop.countDocuments({ _id: { $in: cropIds }, owner: ownerId });
  return owned === cropIds.length;
};

// Una compra se identifica por su orderId (UUID). Las compras viejas sin orderId se identifican
// por el _id de su único producto. En ambos casos solo se toca lo del usuario y aún por pagar.
const orderFilter = (ownerId, key) => {
  if (isUUID(key)) return { owner: ownerId, orderId: key, paymentStatus: 'pendiente' };
  if (isObjectId(key)) return { owner: ownerId, _id: key, orderId: '', paymentStatus: 'pendiente' };
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
    // Nunca permitir cambiar el dueño del gasto desde el cuerpo de la petición
    delete updateData.owner;

    // Si el gasto tiene cantidad y se cambia el valor total, el precio unitario se ajusta
    // para que cantidad × precio siga cuadrando con el valor.
    if (req.body.amount !== undefined) {
      const current = await Expense.findOne({ _id: req.params.id, owner: req.user._id }).select('amount quantity');
      if (current && current.quantity > 0 && Number(req.body.amount) !== current.amount) {
        updateData.unitPrice = roundMoney(Number(req.body.amount) / current.quantity);
      }
    }

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

    // Los cultivos son opcionales (sin cultivo = gasto general); los que vengan deben ser del usuario
    if (!(await cropsAreOwned(req.user._id, items))) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const fields = items.map(buildItemFields);
    if (fields.some((f) => !f)) return res.status(400).json({ message: 'Cada producto necesita un valor mayor a 0.' });

    const orderId = crypto.randomUUID();
    const created = await Expense.insertMany(
      items.map((item, idx) => ({
        owner: req.user._id,
        crop: item.crop || null,
        date,
        description: item.description,
        category: item.category,
        ...fields[idx],
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

// @desc    Agregar productos a una compra que sigue por pagar
// @route   POST /api/expenses/pending/order/:orderId/items
const addItemsToOrder = async (req, res, next) => {
  try {
    const filter = orderFilter(req.user._id, req.params.orderId);
    if (!filter) return res.status(400).json({ message: 'Compra inválida.' });
    const { items } = req.body;

    const first = await Expense.findOne(filter);
    if (!first) return res.status(404).json({ message: 'Compra por pagar no encontrada.' });

    if (!(await cropsAreOwned(req.user._id, items))) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const fields = items.map(buildItemFields);
    if (fields.some((f) => !f)) return res.status(400).json({ message: 'Cada producto necesita un valor mayor a 0.' });

    // Compra vieja sin orderId: se le asigna uno para poder agruparla con los productos nuevos
    let orderId = first.orderId;
    if (!orderId) {
      orderId = crypto.randomUUID();
      await Expense.updateOne({ _id: first._id, owner: req.user._id }, { orderId });
    }

    const currentCount = await Expense.countDocuments({ owner: req.user._id, orderId, paymentStatus: 'pendiente' });
    if (currentCount + items.length > MAX_ITEMS_PER_ORDER) {
      return res.status(400).json({ message: `Una compra no puede tener más de ${MAX_ITEMS_PER_ORDER} productos.` });
    }

    const created = await Expense.insertMany(
      items.map((item, idx) => ({
        owner: req.user._id,
        crop: item.crop || null,
        date: first.date,
        description: item.description,
        category: item.category,
        ...fields[idx],
        paymentMethod: 'credito',
        observations: first.observations,
        paymentStatus: 'pendiente',
        supplier: first.supplier,
        dueDate: first.dueDate,
        orderId,
      }))
    );
    res.status(201).json({ orderId, count: created.length, expenses: created });
  } catch (error) {
    next(error);
  }
};

// @desc    Editar los datos generales de una compra por pagar (proveedor, fecha, fecha límite)
// @route   PUT /api/expenses/pending/order/:orderId
const updatePendingOrder = async (req, res, next) => {
  try {
    const filter = orderFilter(req.user._id, req.params.orderId);
    if (!filter) return res.status(400).json({ message: 'Compra inválida.' });

    const set = {};
    if (req.body.supplier !== undefined) set.supplier = String(req.body.supplier).trim();
    if (req.body.date) set.date = new Date(req.body.date);
    if ('dueDate' in req.body) set.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (!Object.keys(set).length) return res.status(400).json({ message: 'No hay cambios para guardar.' });

    const result = await Expense.updateMany(filter, { $set: set }, { runValidators: true });
    if (!result.matchedCount) return res.status(404).json({ message: 'Compra por pagar no encontrada.' });
    res.json({ message: 'Compra actualizada.', updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una compra por pagar completa (todos sus productos)
// @route   DELETE /api/expenses/pending/order/:orderId
const deletePendingOrder = async (req, res, next) => {
  try {
    const filter = orderFilter(req.user._id, req.params.orderId);
    if (!filter) return res.status(400).json({ message: 'Compra inválida.' });
    const result = await Expense.deleteMany(filter);
    if (!result.deletedCount) return res.status(404).json({ message: 'Compra por pagar no encontrada.' });
    res.json({ message: 'Compra eliminada.', deleted: result.deletedCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Editar un producto de una compra por pagar
// @route   PUT /api/expenses/pending/item/:id
const updatePendingItem = async (req, res, next) => {
  try {
    const { description, category, crop } = req.body;

    if (crop && !(await cropsAreOwned(req.user._id, [{ crop }]))) {
      return res.status(404).json({ message: 'Cultivo no encontrado.' });
    }
    const fields = buildItemFields(req.body);
    if (!fields) return res.status(400).json({ message: 'El producto necesita un valor mayor a 0.' });

    // Solo se permiten estos campos (nada de owner, orderId, paymentStatus, etc.)
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id, paymentStatus: 'pendiente' },
      { $set: { description, category, crop: crop || null, ...fields } },
      { new: true, runValidators: true }
    ).populate('crop', 'name type');

    if (!expense) return res.status(404).json({ message: 'Gasto por pagar no encontrado.' });
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un producto de una compra por pagar
// @route   DELETE /api/expenses/pending/item/:id
const deletePendingItem = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, owner: req.user._id, paymentStatus: 'pendiente' });
    if (!expense) return res.status(404).json({ message: 'Gasto por pagar no encontrado.' });
    res.json({ message: 'Producto eliminado.' });
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

// Al pagar, queda un recibo en Comprobantes (con o sin cultivo). Es idempotente por reciboKey.
// Si falla, no debe tumbar el pago: el gasto ya quedó como pagado.
const saveRecibo = async (ownerId, key, expenses, paid) => {
  try {
    if (!expenses.length) return;
    const crops = [...new Set(expenses.map((e) => String(e.crop?._id || e.crop || '')))];
    const first = expenses[0];
    await Receipt.findOneAndUpdate(
      { owner: ownerId, reciboKey: key },
      {
        owner: ownerId,
        reciboKey: key,
        kind: 'recibo',
        crop: crops.length === 1 && crops[0] ? (first.crop?._id || first.crop) : null,
        category: 'Compra pagada',
        description: first.supplier ? `Compra a ${first.supplier}` : 'Compra pagada',
        date: paid.paidAt,
        amount: expenses.reduce((s, e) => s + (e.amount || 0), 0),
        supplier: first.supplier || '',
        paymentMethod: paid.paymentMethod,
        items: expenses.map((e) => ({
          description: e.description, category: e.category, amount: e.amount, cropName: e.crop?.name || '',
        })),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error('No se pudo guardar el recibo:', err.message);
  }
};

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
    await saveRecibo(req.user._id, `exp:${expense._id}`, [expense], expense);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// @desc    Marcar como pagada toda una compra
// @route   POST /api/expenses/pending/order/:orderId/pay
const payOrder = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id, orderId: req.params.orderId, paymentStatus: 'pendiente' };
    const toPay = await Expense.find(filter).populate('crop', 'name');
    const data = paymentData(req.body);
    const result = await Expense.updateMany(filter, data);
    if (!result.matchedCount) return res.status(404).json({ message: 'Compra por pagar no encontrada.' });
    await saveRecibo(req.user._id, `order:${req.params.orderId}`, toPay, data);
    res.json({ message: 'Compra marcada como pagada.', updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getPendingExpenses, createPendingOrder, payExpense, payOrder,
  addItemsToOrder, updatePendingOrder, deletePendingOrder, updatePendingItem, deletePendingItem,
};