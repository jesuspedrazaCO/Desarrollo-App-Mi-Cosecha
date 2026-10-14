const mongoose = require('mongoose');

// Tipo de labor realizada. "fumigacion" es la que además lleva tanque/caneca
// (para calcular dosis por litro), las demás solo registran producto y cantidad.
const APPLICATION_TYPES = ['fertilizacion', 'fumigacion', 'riego', 'otro'];

const applicationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: [true, 'El cultivo es obligatorio'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },
    type: {
      type: String,
      enum: APPLICATION_TYPES,
      default: 'fertilizacion',
    },
    // Nombre libre del insumo/producto (ej: "Abono Triple 15", "Fungicida X").
    // Texto libre a propósito, igual que `variety` en Income — no todos los
    // cultivos usan los mismos productos.
    product: {
      type: String,
      required: [true, 'El producto es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre del producto es demasiado largo'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad aplicada es obligatoria'],
      min: [0, 'La cantidad no puede ser negativa'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'bultos',
      maxlength: [20, 'La unidad es demasiado larga'],
    },
    // Solo aplica cuando se fumiga/riega con una mezcla en tanque o caneca
    // (ej: 200 L, 1000 L). Opcional porque un abono en seco no lo necesita.
    tankVolume: {
      type: Number,
      min: [0, 'El volumen del tanque no puede ser negativo'],
      default: null,
    },
    tankUnit: {
      type: String,
      trim: true,
      default: 'L',
      maxlength: [20, 'La unidad del tanque es demasiado larga'],
    },
    observations: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Las observaciones son demasiado largas'],
    },
  },
  { timestamps: true }
);

applicationSchema.index({ owner: 1, crop: 1, date: -1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_TYPES = APPLICATION_TYPES;