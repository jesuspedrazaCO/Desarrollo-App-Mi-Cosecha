const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema(
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
      enum: ['venta_cosecha', 'venta_parcial', 'otro'],
      default: 'venta_cosecha',
    },
    client: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'El nombre del cliente es demasiado largo'],
    },
    quantitySold: {
      type: Number,
      min: [0, 'La cantidad no puede ser negativa'],
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: 'kg',
      maxlength: [20, 'La unidad es demasiado larga'],
    },
    salePrice: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'El valor total es obligatorio'],
      min: [0, 'El valor total no puede ser negativo'],
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

incomeSchema.index({ owner: 1, crop: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
