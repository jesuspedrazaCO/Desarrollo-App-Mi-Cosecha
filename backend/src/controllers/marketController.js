const MarketList = require('../models/MarketList');
const MarketItem = require('../models/MarketItem');

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
        return { ...list.toObject(), totalEstimated, totalItems, purchasedItems };
      })
    );
    res.json(listsWithTotals);
  } catch (error) { next(error); }
};

const getListById = async (req, res, next) => {
  try {
    const list = await MarketList.findOne({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });
    const items = await MarketItem.find({ list: list._id }).sort({ createdAt: 1 });
    const totalEstimated = items.reduce((sum, i) => sum + i.quantity * i.estimatedPrice, 0);
    res.json({ list, items, totalEstimated });
  } catch (error) { next(error); }
};

const createList = async (req, res, next) => {
  try {
    const list = await MarketList.create({ ...req.body, owner: req.user._id });
    res.status(201).json(list);
  } catch (error) { next(error); }
};

const updateList = async (req, res, next) => {
  try {
    const list = await MarketList.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });
    res.json(list);
  } catch (error) { next(error); }
};

const deleteList = async (req, res, next) => {
  try {
    const list = await MarketList.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });
    await MarketItem.deleteMany({ list: list._id });
    res.json({ message: 'Lista eliminada correctamente.' });
  } catch (error) { next(error); }
};

const addItem = async (req, res, next) => {
  try {
    const list = await MarketList.findOne({ _id: req.params.listId, owner: req.user._id });
    if (!list) return res.status(404).json({ message: 'Lista no encontrada.' });
    const item = await MarketItem.create({ ...req.body, list: list._id, owner: req.user._id });
    res.status(201).json(item);
  } catch (error) { next(error); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await MarketItem.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json(item);
  } catch (error) { next(error); }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await MarketItem.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (error) { next(error); }
};

module.exports = { getLists, getListById, createList, updateList, deleteList, addItem, updateItem, deleteItem };
