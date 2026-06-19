const Crop = require('../models/Crop');
const Expense = require('../models/Expense');
const Income = require('../models/Income');

// @desc    Listar cultivos del usuario
// @route   GET /api/crops
const getCrops = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { owner: req.user._id };

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const crops = await Crop.find(query).sort({ createdAt: -1 });

    // Agregar resumen financiero rápido a cada cultivo
    const cropsWithSummary = await Promise.all(
      crops.map(async (crop) => {
        const expenses = await Expense.aggregate([
          { $match: { crop: crop._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const incomes = await Income.aggregate([
          { $match: { crop: crop._id } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        const totalInvested = expenses[0]?.total || 0;
        const totalSold = incomes[0]?.total || 0;

        return {
          ...crop.toObject(),
          totalInvested,
          totalSold,
          netProfit: totalSold - totalInvested,
        };
      })
    );

    res.json(cropsWithSummary);
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un cultivo por ID con resumen financiero completo
// @route   GET /api/crops/:id
const getCropById = async (req, res, next) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const expenses = await Expense.find({ crop: crop._id }).sort({ date: -1 });
    const incomes = await Income.find({ crop: crop._id }).sort({ date: -1 });

    const totalInvested = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSold = incomes.reduce((sum, i) => sum + i.totalAmount, 0);
    const netProfit = totalSold - totalInvested;
    const profitability = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    res.json({
      crop,
      expenses,
      incomes,
      summary: {
        totalInvested,
        totalSold,
        netProfit,
        profitability: Math.round(profitability * 100) / 100,
        isProfit: netProfit >= 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear cultivo
// @route   POST /api/crops
const createCrop = async (req, res, next) => {
  try {
    const crop = await Crop.create({ ...req.body, owner: req.user._id });
    res.status(201).json(crop);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar cultivo
// @route   PUT /api/crops/:id
const updateCrop = async (req, res, next) => {
  try {
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });
    res.json(crop);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar cultivo (y sus gastos/ingresos asociados)
// @route   DELETE /api/crops/:id
const deleteCrop = async (req, res, next) => {
  try {
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    await Expense.deleteMany({ crop: crop._id });
    await Income.deleteMany({ crop: crop._id });

    res.json({ message: 'Cultivo eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCrops, getCropById, createCrop, updateCrop, deleteCrop };
