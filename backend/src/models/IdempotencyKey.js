const mongoose = require('mongoose');

// Evita registrar dos veces lo mismo cuando el celular reintenta un envío (por ejemplo, tras volver el
// internet). Cada registro creado sin conexión viaja con una clave única; si ya se procesó, el servidor
// devuelve la misma respuesta en vez de crear otro registro. Se borra solo a los 7 días.
const idempotencyKeySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, required: true },
    key: { type: String, required: true },
    path: { type: String, required: true },
    state: { type: String, enum: ['processing', 'done'], default: 'processing' },
    status: { type: Number },
    body: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

idempotencyKeySchema.index({ actor: 1, key: 1 }, { unique: true });
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);