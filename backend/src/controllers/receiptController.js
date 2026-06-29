const cloudinary = require('../config/cloudinary');
const Receipt = require('../models/Receipt');
const streamifier = require('streamifier');

// Helper: sube buffer a Cloudinary
const uploadToCloudinary = (buffer, mimetype, folder = 'agrofinanzas/receipts') => {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image';
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const getReceipts = async (req, res, next) => {
  try {
    const { crop, category, startDate, endDate, page = 1, limit = 24 } = req.query;
    const query = { owner: req.user._id };
    if (crop) query.crop = crop;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Receipt.countDocuments(query);
    const receipts = await Receipt.find(query)
      .populate('crop', 'name type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ receipts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Debes adjuntar un archivo.' });
    const { crop, category, description, date } = req.body;

    // Subir a Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    const receipt = await Receipt.create({
      owner: req.user._id,
      crop: crop || null,
      category: category || '',
      description: description || '',
      date: date || Date.now(),
      fileName: result.public_id,
      fileUrl: result.secure_url,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await receipt.populate('crop', 'name type');
    res.status(201).json(receipt);
  } catch (error) { next(error); }
};

const deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!receipt) return res.status(404).json({ message: 'Comprobante no encontrado.' });

    // Borrar de Cloudinary
    if (receipt.fileName) {
      const resourceType = receipt.fileType === 'application/pdf' ? 'raw' : 'image';
      await cloudinary.uploader.destroy(receipt.fileName, { resource_type: resourceType });
    }

    res.json({ message: 'Comprobante eliminado correctamente.' });
  } catch (error) { next(error); }
};

module.exports = { getReceipts, uploadReceipt, deleteReceipt };
