const Crop = require('../models/Crop');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const { calculateCropSummary } = require('../utils/financialCalculations');

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
        // Plata de ESTE cultivo que se usó para pagar gastos de OTROS cultivos
        const lent = await Expense.aggregate([
          { $match: { fundedByCrop: crop._id } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const totalInvested = expenses[0]?.total || 0;
        const totalSold = incomes[0]?.total || 0;
        const totalLent = lent[0]?.total || 0;

        const cropSummary = calculateCropSummary(totalInvested, totalSold, totalLent);

        return {
          ...crop.toObject(),
          ...cropSummary,
        };
      })
    );

    res.json(cropsWithSummary);
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener un cultivo por ID (con su detalle financiero)
// @route   GET /api/crops/:id
const getCropById = async (req, res, next) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    // Obtener todos los gastos e ingresos de este cultivo
    const expenses = await Expense.find({ crop: crop._id }).sort({ date: -1 });
    const incomes = await Income.find({ crop: crop._id }).sort({ date: -1 });

    // Gastos de OTROS cultivos que se pagaron con plata de este — no son un
    // gasto de este cultivo, pero sí plata que salió de aquí y hay que restar
    // del disponible. Se muestran aparte, sin duplicar el registro.
    const lentExpenses = await Expense.find({ fundedByCrop: crop._id })
      .populate('crop', 'name type')
      .sort({ date: -1 });

    const totalInvested = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSold = incomes.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalLent = lentExpenses.reduce((sum, e) => sum + e.amount, 0);

    const cropSummary = calculateCropSummary(totalInvested, totalSold, totalLent);

    res.json({
      crop,
      expenses,
      incomes,
      lentExpenses,
      summary: cropSummary,
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

    // Limpieza en cascada de colecciones vinculadas
    await Expense.deleteMany({ crop: crop._id });
    await Income.deleteMany({ crop: crop._id });

    res.json({ message: 'Cultivo y datos financieros asociados eliminados.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCrops,
  getCropById,
  createCrop,
  updateCrop,
  deleteCrop,
};