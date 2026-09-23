const mongoose = require('mongoose');

const incomeItemSchema = new mongoose.Schema(
  {
    variety: {
      type: String,
      required: [true, 'La variedad o producto es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre de la variedad es demasiado largo'],
    },
    quantitySold: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [0, 'La cantidad no puede ser negativa'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'kg',
      maxlength: [20, 'La unidad es demasiado larga'],
    },
    crates: {
      type: Number,
      min: [0, 'Las canastillas no pueden ser negativas'],
      default: 0,
    },
    salePrice: {
      type: Number,
      required: [true, 'El precio por unidad es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    subtotal: {
      type: Number,
      min: [0, 'El subtotal no puede ser negativo'],
      default: 0,
    },
  },
  { _id: false }
);

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
    // Desglose de la venta: qué se vendió, cuánto, en cuántas canastillas y a qué precio
    items: {
      type: [incomeItemSchema],
      default: [],
    },
    // Campos heredados: ventas registradas antes del desglose por producto.
    // Se conservan para no perder historial; las ventas nuevas usan `items`.
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

// Si la venta tiene desglose por producto, calcula subtotales y el total automáticamente
incomeSchema.pre('validate', function (next) {
  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => {
      item.subtotal = Number(item.quantitySold || 0) * Number(item.salePrice || 0);
    });
    this.totalAmount = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }
  next();
});

incomeSchema.index({ owner: 1, crop: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);