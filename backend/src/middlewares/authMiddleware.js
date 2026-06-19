const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No autorizado. Inicia sesión de nuevo.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
  }
};

module.exports = { protect };
