const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    farmName: { type: String, trim: true, default: 'Mi Finca', maxlength: 100 },
    location: { type: String, trim: true, default: '' },
    phone:    { type: String, trim: true, default: '' },
    avatar:   { type: String, default: '' },
    active:   { type: Boolean, default: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    // Acceso compartido a la finca: 'admin' es el dueño de la cuenta; 'viewer' (lector) solo ve datos.
    // Un lector apunta con farmOwner a la cuenta del administrador cuya finca puede ver.
    // Las cuentas que ya existen no tienen estos campos y se tratan como administradores.
    role:      { type: String, enum: ['admin', 'viewer'], default: 'admin' },
    farmOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    resetPasswordToken:   { type: String, select: false, default: undefined },
    resetPasswordExpires: { type: Date, select: false, default: undefined },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);