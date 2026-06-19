const mongoose = require('mongoose');

const EVENT_TYPES = [
  'siembra',
  'cosecha',
  'pago_pendiente',
  'servicio_hogar',
  'actividad_agricola',
  'otro',
];

const calendarEventSchema = new mongoose.Schema(
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
    },
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [150, 'El título es demasiado largo'],
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      default: 'otro',
    },
    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
    },
    amount: {
      type: Number,
      min: [0, 'El valor no puede ser negativo'],
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Las notas son demasiado largas'],
    },
  },
  { timestamps: true }
);

calendarEventSchema.index({ owner: 1, date: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;