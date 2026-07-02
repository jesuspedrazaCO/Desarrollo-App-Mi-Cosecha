const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    presentation: {
      type: String,
      trim: true,
      default: '',
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    previousPrice: {
      type: Number,
      default: 0,
    },
    pricePerKg: {
      type: Number,
      default: 0,
    },
    trend: {
      type: String,
      enum: ['subio', 'bajo', 'igual'],
      default: 'igual',
    },
    variationPct: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      trim: true,
      default: 'otros',
    },
    source: {
      type: String,
      default: 'Centroabastos Bucaramanga',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice de texto para búsqueda
marketPriceSchema.index({ product: 'text' });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
