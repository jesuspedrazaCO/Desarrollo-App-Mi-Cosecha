const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del cultivo es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre es demasiado largo'],
    },
    type: {
      type: String,
      required: [true, 'El tipo de cultivo es obligatorio'],
      trim: true,
      maxlength: [100, 'El tipo es demasiado largo'],
    },
    startDate: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria'],
    },
    estimatedHarvestDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'La ubicación es demasiado larga'],
    },
    landSize: {
      type: Number,
      min: [0, 'El tamaño del terreno no puede ser negativo'],
      default: 0,
    },
    landSizeUnit: {
      type: String,
      enum: ['hectáreas', 'metros2', 'cuadras', 'fanegadas'],
      default: 'hectáreas',
    },
    status: {
      type: String,
      enum: ['activo', 'finalizado', 'suspendido'],
      default: 'activo',
    },
    observations: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Las observaciones son demasiado largas'],
    },
  },
  { timestamps: true }
);

cropSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Crop', cropSchema);
