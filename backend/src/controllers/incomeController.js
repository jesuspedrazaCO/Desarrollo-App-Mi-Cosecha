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

// @desc    Crear ingreso (venta con uno o varios productos)
// @route   POST /api/income
const createIncome = async (req, res, next) => {
  try {
    const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const body = { ...req.body };

    // Compatibilidad con el formato antiguo (venta sin desglose por producto)
    if ((!body.items || body.items.length === 0) && body.quantitySold && body.salePrice && !body.totalAmount) {
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
    if ((!body.items || body.items.length === 0) && body.quantitySold && body.salePrice && !body.totalAmount) {
      body.totalAmount = Number(body.quantitySold) * Number(body.salePrice);
    }

    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      body,
      { new: true, runValidators: true, context: 'query' }
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

// @desc    Agrupar varios ingresos dispersos en uno solo con desglose por producto
// @route   POST /api/income/merge
const mergeIncomes = async (req, res, next) => {
  try {
    const { ids, crop, date, client, type, observations } = req.body;

    if (!Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ message: 'Selecciona al menos dos ingresos para agrupar.' });
    }

    const cropDoc = await Crop.findOne({ _id: crop, owner: req.user._id });
    if (!cropDoc) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    // Verificar que todos los ingresos seleccionados existan y sean del usuario
    const originals = await Income.find({ _id: { $in: ids }, owner: req.user._id });
    if (originals.length !== ids.length) {
      return res.status(404).json({ message: 'Alguno de los ingresos seleccionados no existe o no te pertenece.' });
    }

    // Construir items[] a partir de cada ingreso original (respetando su desglose si ya lo tenía)
    const items = originals.flatMap((income) => {
      if (Array.isArray(income.items) && income.items.length > 0) {
        return income.items.map((it) => ({
          variety: it.variety,
          quantitySold: it.quantitySold,
          unit: it.unit,
          crates: it.crates || 0,
          salePrice: it.salePrice,
        }));
      }
      return [{
        variety: 'Venta',
        quantitySold: income.quantitySold || 0,
        unit: income.unit || 'kg',
        crates: 0,
        salePrice: income.salePrice || 0,
      }];
    });

    const merged = await Income.create({
      owner: req.user._id,
      crop,
      date: date || originals[0].date,
      type: type || 'venta_cosecha',
      client: client ?? originals[0].client,
      items,
      observations: observations || '',
    });

    await Income.deleteMany({ _id: { $in: ids }, owner: req.user._id });
    await merged.populate('crop', 'name type');

    res.status(201).json(merged);
  } catch (error) {
    next(error);
  }
};

module.exports = { getIncomes, createIncome, updateIncome, deleteIncome, mergeIncomes };