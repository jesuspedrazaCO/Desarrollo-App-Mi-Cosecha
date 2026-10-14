const Application = require('../models/Application');
const Crop = require('../models/Crop');

// @desc    Listar aplicaciones/insumos de un cultivo (con filtros opcionales)
// @route   GET /api/applications
const getApplications = async (req, res, next) => {
  try {
    const { crop, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { owner: req.user._id };

    if (crop) query.crop = crop;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('crop', 'name type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      applications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Contador agregado: cuánto se ha usado de cada producto en un cultivo
// @route   GET /api/applications/summary
const getApplicationSummary = async (req, res, next) => {
  try {
    const { crop } = req.query;
    if (!crop) return res.status(400).json({ message: 'El cultivo es obligatorio.' });

    const cropDoc = await Crop.findOne({ _id: crop, owner: req.user._id });
    if (!cropDoc) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const summary = await Application.aggregate([
      { $match: { owner: req.user._id, crop: cropDoc._id } },
      {
        $group: {
          _id: {
            product: { $toLower: { $trim: { input: '$product' } } },
            unit: { $toLower: { $trim: { input: '$unit' } } },
          },
          productLabel: { $first: '$product' },
          unitLabel: { $first: '$unit' },
          type: { $first: '$type' },
          totalQuantity: { $sum: '$quantity' },
          applicationsCount: { $sum: 1 },
          lastDate: { $max: '$date' },
        },
      },
      { $sort: { lastDate: -1 } },
      {
        $project: {
          _id: 0,
          product: '$productLabel',
          unit: '$unitLabel',
          type: 1,
          totalQuantity: 1,
          applicationsCount: 1,
          lastDate: 1,
        },
      },
    ]);

    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Registrar una aplicación/insumo
// @route   POST /api/applications
const createApplication = async (req, res, next) => {
  try {
    const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
    if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });

    const application = await Application.create({ ...req.body, owner: req.user._id });
    await application.populate('crop', 'name type');
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar una aplicación/insumo
// @route   PUT /api/applications/:id
const updateApplication = async (req, res, next) => {
  try {
    if (req.body.crop) {
      const crop = await Crop.findOne({ _id: req.body.crop, owner: req.user._id });
      if (!crop) return res.status(404).json({ message: 'Cultivo no encontrado.' });
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true, context: 'query' }
    ).populate('crop', 'name type');

    if (!application) return res.status(404).json({ message: 'Registro no encontrado.' });
    res.json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar una aplicación/insumo
// @route   DELETE /api/applications/:id
const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!application) return res.status(404).json({ message: 'Registro no encontrado.' });
    res.json({ message: 'Registro eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApplications,
  getApplicationSummary,
  createApplication,
  updateApplication,
  deleteApplication,
};