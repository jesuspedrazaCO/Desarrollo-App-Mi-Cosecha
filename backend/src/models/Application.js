const mongoose = require('mongoose');

// Tipo de labor realizada.
const APPLICATION_TYPES = ['fertilizacion', 'fumigacion', 'riego', 'otro'];

// Cada producto que se mezcló/aplicó en una misma aplicación
// (ej: en una caneca de 200 L: Trilla 0.5 kg + Verdín 200 ml).
const applicationItemSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: [true, 'El producto es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre del producto es demasiado largo'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [0, 'La cantidad no puede ser negativa'],
    },
    unit: {
      type: String,
      trim: true,
      default: 'bultos',
      maxlength: [20, 'La unidad es demasiado larga'],
    },
    // Cuánto se le puso a CADA caneca (opcional). `quantity` siempre es el TOTAL de la aplicación
    // (perTank × tankCount), así los totales por producto y el historial no cambian.
    perTank: { type: Number, min: [0, 'La cantidad por caneca no puede ser negativa'], default: undefined },
  },
  { _id: false }
);

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
    // Productos de esta aplicación. Una caneca/tanque puede llevar varios.
    items: {
      type: [applicationItemSchema],
      default: [],
    },
    // Tanque/caneca donde se hizo la mezcla (ej: 200 L, 1000 L). Opcional.
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
    // Cuántas canecas/tanques se gastaron con esta misma mezcla (los registros viejos cuentan como 1).
    tankCount: {
      type: Number,
      min: [1, 'Debe ser al menos 1 caneca'],
      default: 1,
    },
    // Campos heredados: registros creados antes de que una aplicación pudiera
    // llevar varios productos (un registro = un producto). Se conservan para
    // no perder esos datos; los registros nuevos usan `items`.
    product: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'El nombre del producto es demasiado largo'],
    },
    quantity: {
      type: Number,
      min: [0, 'La cantidad no puede ser negativa'],
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: 'bultos',
      maxlength: [20, 'La unidad es demasiado larga'],
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

// Una aplicación debe tener al menos un producto (nuevo formato) o, si es un
// registro heredado, el producto antiguo.
applicationSchema.pre('validate', function (next) {
  const hasItems = this.items && this.items.length > 0;
  const hasLegacy = this.product && this.product.trim().length > 0;
  if (!hasItems && !hasLegacy) {
    this.invalidate('items', 'Agrega al menos un producto');
  }
  next();
});

applicationSchema.index({ owner: 1, crop: 1, date: -1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_TYPES = APPLICATION_TYPES;