const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crop:        { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', default: null, index: true },
    category:    { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    date:        { type: Date, default: Date.now },
    fileName:    { type: String, default: '' },
    fileUrl:     { type: String, default: '' },
    originalName:{ type: String, default: '' },
    fileType:    { type: String, default: '' },
    fileSize:    { type: Number, default: 0 },
    // 'archivo' = foto subida por el usuario (como siempre).
    // 'recibo'  = comprobante generado automáticamente al pagar una compra pendiente.
    kind:        { type: String, enum: ['archivo', 'recibo'], default: 'archivo' },
    amount:      { type: Number, default: 0 },
    supplier:    { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    reciboKey:   { type: String, default: '', index: true },
    items: [{
      _id: false,
      description: String,
      category: String,
      amount: Number,
      cropName: { type: String, default: '' },
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
