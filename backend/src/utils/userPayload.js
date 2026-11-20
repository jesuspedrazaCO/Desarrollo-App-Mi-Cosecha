const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Datos del usuario que recibe el frontend. Un lector muestra los datos de la finca
// (nombre, ubicación) de su administrador, pero su propio nombre, correo, foto y teléfono.
const buildPayload = async (user) => {
  let farm = user;
  if (user.farmOwner) {
    const owner = await User.findById(user.farmOwner).select('farmName location lat lng');
    if (owner) farm = owner;
  }
  return {
    _id: user._id, name: user.name, email: user.email,
    farmName: farm.farmName, location: farm.location,
    phone: user.phone, avatar: user.avatar,
    lat: farm.lat, lng: farm.lng,
    role: user.role || 'admin',
  };
};

module.exports = { signToken, buildPayload };