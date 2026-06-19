const mongoose = require('mongoose');

const marketListSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la lista es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre es demasiado largo'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pendiente', 'completada'],
      default: 'pendiente',
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

marketListSchema.index({ owner: 1, date: -1 });

module.exports = mongoose.model('MarketList', marketListSchema);
