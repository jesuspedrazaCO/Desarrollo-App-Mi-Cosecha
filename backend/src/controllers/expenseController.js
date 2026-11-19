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

// Ids de cultivo que menciona un producto (cultivo único o reparto entre varios)
const itemCropIds = (item) =>
  (Array.isArray(item.allocations) && item.allocations.length
    ? item.allocations.map((a) => a.crop)
    : [item.crop]
  ).filter(Boolean).map(String);

// Todos los cultivos que vengan deben ser del usuario
const cropsAreOwned = async (ownerId, items) => {
  const cropIds = [...new Set(items.flatMap(itemCropIds))];
  if (!cropIds.length) return true;
  const owned = await Crop.countDocuments({ _id: { $in: cropIds }, owner: ownerId });
  return owned === cropIds.length;
};

const MAX_ALLOCATIONS = 20;
const MAX_DOCS_PER_ORDER = 100;

// Convierte un producto del formulario en la lista de gastos que se guardan (uno por cultivo).
// Con "allocations" ([{crop, quantity}]) el producto se reparte entre cultivos: cada cultivo recibe
// su cantidad y su gasto (cantidad × precio unitario). Sin "allocations" es un solo gasto.
// Devuelve null si algo no cuadra (valores, suma del reparto, etc.).
const buildLineDocs = (item) => {
  const hasAlloc = Array.isArray(item.allocations) && item.allocations.length > 0;
  if (!hasAlloc) {
    const f = buildItemFields(item);
    return f ? [{ crop: item.crop || null, ...f }] : null;
  }
  if (item.allocations.length > MAX_ALLOCATIONS) return null;
  const unitPrice = Number(item.unitPrice);
  if (!(unitPrice > 0)) return null;
  const unit = String(item.unit || '').trim().slice(0, 20) || 'unidad';

  // Si el mismo cultivo aparece dos veces, se suman sus cantidades
  const merged = new Map();
  for (const a of item.allocations) {
    const q = Number(a.quantity);
    if (!(q > 0)) return null;
    const key = a.crop ? String(a.crop) : '';
    merged.set(key, (merged.get(key) || 0) + q);
  }

  // La cantidad total debe coincidir con la suma del reparto
  const total = [...merged.values()].reduce((sum, q) => sum + q, 0);
  const hasQty = item.quantity !== undefined && item.quantity !== null && item.quantity !== '';
  if (hasQty && Math.abs(total - Number(item.quantity)) > 1e-6) return null;

  const docs = [...merged].map(([crop, quantity]) => ({
    crop: crop || null, quantity, unit, unitPrice, amount: roundMoney(quantity * unitPrice),
  }));
  return docs.every((d) => d.amount > 0) ? docs : null;
};

// Un producto (con su reparto) se identifica por su lineId (UUID); los gastos viejos sin lineId
// se identifican por su propio _id.
const lineFilter = (ownerId, key) => {
  if (isUUID(key)) return { owner: ownerId, lineId: key, paymentStatus: 'pendiente' };
  if (isObjectId(key)) return { owner: ownerId, _id: key, paymentStatus: 'pendiente' };
  return null;
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

// Arma los documentos Expense de una lista de productos (cada producto puede repartirse en varios cultivos)
const docsFromItems = (items, lines, base) =>
  items.flatMap((item, idx) => {
    const lineId = crypto.randomUUID();
    return lines[idx].map((d) => ({
      ...base,
      crop: d.crop,
      description: item.description,
      category: item.category,
      quantity: d.quantity,
      unit: d.unit,
      unitPrice: d.unitPrice,
      amount: d.amount,
      lineId,
    }));
  });

// @desc    Registrar una compra por pagar (puede traer varios productos)
// @route   POST /api/expenses/pending
const createPendingOrder = async (req, res, next) => {
  try {
    const { supplier = '', date, dueDate, observations = '', items } = req.body;

    // Los cultivos son opcionales (sin cultivo = gasto general); los que vengan deben ser del usuario
    if (!(await cropsAreOwned(req.user._id, items))) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const lines = items.map(buildLineDocs);
    if (lines.some((l) => !l)) return res.status(400).json({ message: 'Revisa los valores y el reparto por cultivos de cada producto.' });

    const orderId = crypto.randomUUID();
    const docs = docsFromItems(items, lines, {
      owner: req.user._id,
      date,
      paymentMethod: 'credito', // comprado a crédito, aún sin pagar
      observations,
      paymentStatus: 'pendiente',
      supplier,
      dueDate: dueDate || null,
      orderId,
    });
    if (docs.length > MAX_DOCS_PER_ORDER) return res.status(400).json({ message: 'La compra tiene demasiados productos o cultivos.' });

    const created = await Expense.insertMany(docs);
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

    const lines = items.map(buildLineDocs);
    if (lines.some((l) => !l)) return res.status(400).json({ message: 'Revisa los valores y el reparto por cultivos de cada producto.' });

    // Compra vieja sin orderId: se le asigna uno para poder agruparla con los productos nuevos
    let orderId = first.orderId;
    if (!orderId) {
      orderId = crypto.randomUUID();
      await Expense.updateOne({ _id: first._id, owner: req.user._id }, { orderId });
    }

    const docs = docsFromItems(items, lines, {
      owner: req.user._id,
      date: first.date,
      paymentMethod: 'credito',
      observations: first.observations,
      paymentStatus: 'pendiente',
      supplier: first.supplier,
      dueDate: first.dueDate,
      orderId,
    });

    const currentCount = await Expense.countDocuments({ owner: req.user._id, orderId, paymentStatus: 'pendiente' });
    if (currentCount + docs.length > MAX_DOCS_PER_ORDER) {
      return res.status(400).json({ message: 'La compra tiene demasiados productos o cultivos.' });
    }

    const created = await Expense.insertMany(docs);
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

// @desc    Editar un producto de una compra por pagar (incluido su reparto entre cultivos)
// @route   PUT /api/expenses/pending/line/:lineKey
const updatePendingLine = async (req, res, next) => {
  try {
    const filter = lineFilter(req.user._id, req.params.lineKey);
    if (!filter) return res.status(400).json({ message: 'Producto inválido.' });

    const existing = await Expense.find(filter);
    if (!existing.length) return res.status(404).json({ message: 'Producto por pagar no encontrado.' });

    if (!(await cropsAreOwned(req.user._id, [req.body]))) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const docs = buildLineDocs(req.body);
    if (!docs) return res.status(400).json({ message: 'Revisa los valores y el reparto por cultivos del producto.' });

    const first = existing[0];
    const lineId = first.lineId || crypto.randomUUID();
    const { description, category } = req.body;

    // Se actualizan los gastos de los cultivos que siguen, se crean los nuevos y se borran los
    // cultivos que ya no están en el reparto. Los gastos que se conservan mantienen su id.
    const byCrop = new Map(existing.map((e) => [String(e.crop || ''), e]));
    for (const d of docs) {
      const key = d.crop ? String(d.crop) : '';
      const current = byCrop.get(key);
      const fields = { description, category, crop: d.crop, quantity: d.quantity, unit: d.unit, unitPrice: d.unitPrice, amount: d.amount, lineId };
      if (current) {
        await Expense.updateOne({ _id: current._id, owner: req.user._id, paymentStatus: 'pendiente' }, { $set: fields }, { runValidators: true });
        byCrop.delete(key);
      } else {
        await Expense.create({
          ...fields,
          owner: req.user._id,
          date: first.date,
          paymentMethod: 'credito',
          observations: first.observations,
          paymentStatus: 'pendiente',
          supplier: first.supplier,
          dueDate: first.dueDate,
          orderId: first.orderId,
        });
      }
    }
    const leftover = [...byCrop.values()].map((e) => e._id);
    if (leftover.length) {
      await Expense.deleteMany({ _id: { $in: leftover }, owner: req.user._id, paymentStatus: 'pendiente' });
    }

    res.json({ message: 'Producto actualizado.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un producto de una compra por pagar (con todos sus cultivos)
// @route   DELETE /api/expenses/pending/line/:lineKey
const deletePendingLine = async (req, res, next) => {
  try {
    const filter = lineFilter(req.user._id, req.params.lineKey);
    if (!filter) return res.status(400).json({ message: 'Producto inválido.' });
    const result = await Expense.deleteMany(filter);
    if (!result.deletedCount) return res.status(404).json({ message: 'Producto por pagar no encontrado.' });
    res.json({ message: 'Producto eliminado.', deleted: result.deletedCount });
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

// @desc    Marcar como pagado un producto (con todos sus cultivos)
// @route   POST /api/expenses/pending/line/:lineKey/pay
const payLine = async (req, res, next) => {
  try {
    const filter = lineFilter(req.user._id, req.params.lineKey);
    if (!filter) return res.status(400).json({ message: 'Producto inválido.' });
    const toPay = await Expense.find(filter).populate('crop', 'name');
    const data = paymentData(req.body);
    const result = await Expense.updateMany(filter, data);
    if (!result.matchedCount) return res.status(404).json({ message: 'Producto por pagar no encontrado.' });
    await saveRecibo(req.user._id, `line:${req.params.lineKey}`, toPay, data);
    res.json({ message: 'Producto marcado como pagado.', updated: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getPendingExpenses, createPendingOrder, payExpense, payOrder,
  addItemsToOrder, updatePendingOrder, deletePendingOrder, updatePendingLine, deletePendingLine, payLine,
};