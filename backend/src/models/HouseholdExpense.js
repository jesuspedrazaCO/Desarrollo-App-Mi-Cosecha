const mongoose = require('mongoose');

const HOUSEHOLD_CATEGORIES = [
  'agua',
  'energia',
  'gas',
  'internet',
  'telefonia',
  'mercado',
  'transporte',
  'educacion',
  'salud',
  'vivienda',
  'entretenimiento',
  'otros',
];

const PAYMENT_METHODS = ['efectivo', 'transferencia', 'tarjeta', 'credito', 'otro'];

const householdExpenseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: HOUSEHOLD_CATEGORIES,
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [200, 'La descripción es demasiado larga'],
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

householdExpenseSchema.index({ owner: 1, date: -1 });
householdExpenseSchema.index({ owner: 1, category: 1 });

module.exports = mongoose.model('HouseholdExpense', householdExpenseSchema);
module.exports.HOUSEHOLD_CATEGORIES = HOUSEHOLD_CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
