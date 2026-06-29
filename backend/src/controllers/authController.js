const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
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
