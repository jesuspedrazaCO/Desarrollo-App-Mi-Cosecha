const mongoose = require('mongoose');

// Invitación pendiente para que alguien entre a la finca como lector.
// Solo se guarda el hash del token (el token real viaja únicamente en el correo).
const invitationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['viewer'], default: 'viewer' },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Una sola invitación pendiente por correo y finca (reenviar reemplaza la anterior)
invitationSchema.index({ owner: 1, email: 1 }, { unique: true });
// Mongo borra solo las invitaciones vencidas
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invitation', invitationSchema);