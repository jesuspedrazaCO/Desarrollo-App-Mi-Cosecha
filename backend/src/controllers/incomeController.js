const Income = require('../models/Income');
const Crop = require('../models/Crop');

// @desc    Listar ingresos (filtrable por cultivo, rango de fechas)
// @route   GET /api/income
const getIncomes = async (req, res, next) => {
  try {
    const { crop, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { owner: req.user._id };

    if (crop) query.crop = crop;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Income.countDocuments(query);
    const incomes = await Income.find(query)
      .populate('crop', 'name type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalAmount = await Income.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      incomes,
      total,
      totalAmount: totalAmount[0]?.total || 0,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Crear ingreso
// @route   POST /api/income
const createIncome = async (req, res, next) => {
  try {
    const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    // Si no se envía totalAmount pero sí cantidad y precio, calcularlo automáticamente
    const body = { ...req.body };
    if (!body.totalAmount && body.quantitySold && body.salePrice) {
      body.totalAmount = Number(body.quantitySold) * Number(body.salePrice);
    }

    const income = await Income.create({ ...body, owner: req.user._id });
    await income.populate('crop', 'name type');
    res.status(201).json(income);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar ingreso
// @route   PUT /api/income/:id
const updateIncome = async (req, res, next) => {
  try {
    if (req.body.crop) {
      const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
      if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });
    }

    const body = { ...req.body };
    if (body.quantitySold && body.salePrice && !body.totalAmount) {
      body.totalAmount = Number(body.quantitySold) * Number(body.salePrice);
    }

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      body,
      { new: true, runValidators: true }
    ).populate('crop', 'name type');

    if (!income) return res.status(404).json({ message: 'Ingreso no encontrado.' });
    res.json(income);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar ingreso
// @route   DELETE /api/income/:id
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!income) return res.status(404).json({ message: 'Ingreso no encontrado.' });
    res.json({ message: 'Ingreso eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome };
