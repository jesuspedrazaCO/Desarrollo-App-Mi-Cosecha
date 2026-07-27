const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const resend = require('../config/resend');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const userPayload = (user) => ({
  _id: user._id, name: user.name, email: user.email,
  farmName: user.farmName, location: user.location,
  phone: user.phone, avatar: user.avatar,
});

const uploadToCloudinary = (buffer, folder = 'agrofinanzas/avatars') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, farmName, location, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Ya existe una cuenta con ese correo electrónico.' });
    const user = await User.create({ name, email, password, farmName, location, phone });
    const token = signToken(user._id);
    res.status(201).json({ token, user: userPayload(user) });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    if (!user.active) return res.status(401).json({ message: 'Cuenta desactivada.' });
    const token = signToken(user._id);
    res.json({ token, user: userPayload(user) });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) { next(error); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { name, farmName, location, phone, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (name) user.name = name;
    if (farmName !== undefined) user.farmName = farmName;
    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (password) user.password = password;
    await user.save();
    res.json({ user: userPayload(user) });
  } catch (error) { next(error); }
};

exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
    const user = await User.findById(req.user._id);

    // Borrar avatar anterior de Cloudinary
    if (user.avatar && user.avatar.startsWith('agrofinanzas/')) {
      await cloudinary.uploader.destroy(user.avatar, { resource_type: 'image' });
    }

    // Subir nuevo avatar
    const result = await uploadToCloudinary(req.file.buffer);
    user.avatar = result.secure_url;
    await user.save();

    res.json({ user: userPayload(user) });
  } catch (error) { next(error); }
};

// ── Recuperación de contraseña ──────────────────────────────

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Por seguridad, siempre respondemos lo mismo exista o no la cuenta —
    // así nadie puede usar este formulario para averiguar qué correos están registrados.
    const genericResponse = { message: 'Si el correo está registrado, te enviamos instrucciones para recuperar tu contraseña.' };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutos
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;

    try {
      await resend.emails.send({
        from: 'AgroFinanzas <onboarding@resend.dev>',
        to: user.email,
        subject: 'Recupera tu contraseña - AgroFinanzas',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #258a4e;">Recupera tu contraseña</h2>
            <p>Hola ${user.name},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña de AgroFinanzas. Este enlace es válido por 30 minutos:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background: #258a4e; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                Restablecer contraseña
              </a>
            </p>
            <p style="color: #888; font-size: 13px;">Si tú no solicitaste esto, puedes ignorar este correo — tu cuenta sigue segura.</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Si falla el envío del correo, revertimos el token para no dejarlo "colgado"
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Error enviando correo de recuperación:', emailError);
      return res.status(500).json({ message: 'No se pudo enviar el correo. Intenta de nuevo más tarde.' });
    }

    res.json(genericResponse);
  } catch (error) { next(error); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'El enlace es inválido o ya expiró. Solicita uno nuevo.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Lo dejamos logueado directamente tras cambiar la contraseña
    const authToken = signToken(user._id);
    res.json({ token: authToken, user: userPayload(user), message: 'Contraseña actualizada correctamente.' });
  } catch (error) { next(error); }
};