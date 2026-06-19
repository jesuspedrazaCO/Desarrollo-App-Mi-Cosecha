const mongoose = require('mongoose');

const marketItemSchema = new mongoose.Schema(
  {
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketList',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre es demasiado largo'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [0, 'La cantidad no puede ser negativa'],
      default: 1,
    },
    unit: {
      type: String,
      trim: true,
      default: 'unidad',
      maxlength: [20, 'La unidad es demasiado larga'],
    },
    estimatedPrice: {
      type: Number,
      min: [0, 'El precio estimado no puede ser negativo'],
      default: 0,
    },
    purchased: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

marketItemSchema.index({ list: 1 });

module.exports = mongoose.model('MarketItem', marketItemSchema);
