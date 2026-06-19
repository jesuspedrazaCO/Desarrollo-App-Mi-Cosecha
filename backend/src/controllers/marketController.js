const MarketList = require('../models/MarketList');
const MarketItem = require('../models/MarketItem');

// ──────────────────────────────────────────────
// LISTAS
// ──────────────────────────────────────────────

// @desc    Listar listas de mercado del usuario (con totales)
// @route   GET /api/market/lists
const getLists = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { owner: req.user._id };
    if (status) query.status = status;

    const lists = await MarketList.find(query).sort({ date: -1 });

    const listsWithTotals = await Promise.all(
      lists.map(async (list) => {
        const items = await MarketItem.find({ list: list._id });
        const totalEstimated = items.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0);
        const totalItems = items.length;
        const purchasedItems = items.filter((i) => i.purchased).length;

        return {
          ...list.toObject(),
          totalEstimated,
          totalItems,
          purchasedItems,
        };
      })
    );

    res.json(listsWithTotals);
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener una lista con sus productos
// @route   GET /api/market/lists/:id
const getListById = async (req, res, next) => {
  try {
    const list = await MarketList.findOne({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });

    const items = await MarketItem.find({ list: list._id }).sort({ createdAt: 1 });
    const totalEstimated = items.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0);

    res.json({ list, items, totalEstimated });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear lista de mercado
// @route   POST /api/market/lists
const createList = async (req, res, next) => {
  try {
    const list = await MarketList.create({ ...req.body, owner: req.user._id });
    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar lista de mercado
// @route   PUT /api/market/lists/:id
const updateList = async (req, res, next) => {
  try {
    const list = await MarketList.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });
    res.json(list);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar lista de mercado (y sus productos)
// @route   DELETE /api/market/lists/:id
const deleteList = async (req, res, next) => {
  try {
    const list = await MarketList.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });

    await MarketItem.deleteMany({ list: list._id });
    res.json({ message: 'Lista eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PRODUCTOS (ITEMS)
// ──────────────────────────────────────────────

// @desc    Agregar producto a una lista
// @route   POST /api/market/lists/:listId/items
const addItem = async (req, res, next) => {
  try {
    const list = await MarketList.findOne({ _id: req.params.listId, owner: req.user._id });
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });

    const item = await MarketItem.create({
      ...req.body,
      list: list._id,
      owner: req.user._id,
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar producto (cantidad, precio, marcar comprado, etc.)
// @route   PUT /api/market/items/:id
const updateItem = async (req, res, next) => {
  try {
    const item = await MarketItem.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json(item);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar producto
// @route   DELETE /api/market/items/:id
const deleteItem = async (req, res, next) => {
  try {
    const item = await MarketItem.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLists, getListById, createList, updateList, deleteList,
  addItem, updateItem, deleteItem,
};
