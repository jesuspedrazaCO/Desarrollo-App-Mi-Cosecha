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
const PAYMENT_STATUSES = ['pagado', 'pendiente'];

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
      // Opcional: una compra por pagar puede no pertenecer a ningún cultivo (gasto general).
      // El formulario normal de gastos sigue exigiéndolo desde expenseRoutes.
      default: null,
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
    // Quién(es) pagaron este gasto — opcional. Gastos ya existentes simplemente
    // quedan con este arreglo vacío, sin ningún efecto sobre ellos.
    payers: {
      type: [
        {
          contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor', required: true },
          amount: { type: Number, required: true, min: 0 },
          _id: false,
        },
      ],
      default: [],
    },
    // Si la plata para pagar este gasto salió de OTRO cultivo (ej: vendí piña y con
    // esa plata pagué un gasto del cultivo de café), se guarda aquí la referencia.
    // 100% opcional y retrocompatible: los gastos existentes quedan con null,
    // sin ningún cambio de comportamiento.
    fundedByCrop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      default: null,
    },
    // Gastos "por pagar": se compró algo y todavía no se paga. Los gastos existentes no
    // tienen este campo y se tratan como pagados (valor por defecto), así que nada cambia para ellos.
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pagado',
      index: true,
    },
    // A quién se le debe (ferretería, almacén agrícola, vecino...)
    supplier: { type: String, trim: true, default: '', maxlength: [100, 'El nombre del proveedor es demasiado largo'] },
    // Fecha límite para pagar (opcional)
    dueDate: { type: Date, default: null },
    // Cuándo se pagó de verdad (se llena al marcarlo como pagado)
    paidAt: { type: Date, default: null },
    // Detalle opcional del producto comprado (ej: 4 rollos a $50.000 c/u).
    // Compras anteriores no lo tienen (null) y siguen usando solo "amount".
    // Cuando hay cantidad y precio unitario, amount = quantity * unitPrice (lo calcula el servidor).
    quantity: { type: Number, min: [0, 'La cantidad no puede ser negativa'], default: null },
    unit: { type: String, trim: true, default: '', maxlength: [20, 'La unidad es demasiado larga'] },
    unitPrice: { type: Number, min: [0, 'El precio unitario no puede ser negativo'], default: null },
    // Un mismo producto repartido entre varios cultivos (ej: 8 bultos de abono: 5 para un cultivo y
    // 3 para otro) se guarda como un gasto por cultivo, unidos por este identificador. Así cada
    // cultivo recibe su gasto, pero en "Pendientes por pagar" se ve como una sola fila.
    lineId: { type: String, default: '', index: true },
    // Une los gastos que vinieron en una misma compra (4 rollos de manguera + 1 bulto de abono...)
    orderId: { type: String, default: '', index: true },
  },
  { timestamps: true }
);

expenseSchema.index({ owner: 1, crop: 1, date: -1 });
expenseSchema.index({ owner: 1, paymentStatus: 1, dueDate: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;