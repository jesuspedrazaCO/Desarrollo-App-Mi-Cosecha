const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'La categoría es demasiado larga'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'La descripción es demasiado larga'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

receiptSchema.index({ owner: 1, date: -1 });
receiptSchema.index({ owner: 1, crop: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);