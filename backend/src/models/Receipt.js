const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crop:        { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', default: null, index: true },
    category:    { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    date:        { type: Date, default: Date.now },
    fileName:    { type: String, required: true },
    fileUrl:     { type: String, default: '' },
    originalName:{ type: String, required: true },
    fileType:    { type: String, required: true },
    fileSize:    { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
