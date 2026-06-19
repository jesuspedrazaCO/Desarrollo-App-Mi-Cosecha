const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'semillas',
  'fertilizantes',
  'abonos',
  'herbicidas',
  'fungicidas',
  'insecticidas',
  'herramientas',
  'maquinaria',
  'combustible',
  'transporte',
  'mano_de_obra',
  'riego',
  'mantenimiento',
  'otros',
];

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'tarjeta', 'credito', 'otro'];

const expenseSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [200, 'La descripción es demasiado larga'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: EXPENSE_CATEGORIES,
    },
    amount: {
      type: Number,
      required: [true, 'El valor es obligatorio'],
      min: [0, 'El valor no puede ser negativo'],
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'efectivo',
    },
    observations: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Las observaciones son demasiado largas'],
    },
    receipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Receipt',
      default: null,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ owner: 1, crop: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
