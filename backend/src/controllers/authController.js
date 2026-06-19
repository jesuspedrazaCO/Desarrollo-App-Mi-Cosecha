const User = require('../models/User');
const { generateToken } = require('../config/jwt');

// @desc    Registrar nuevo usuario (productor)
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, farmName, location, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe una cuenta con este correo.' });
    }

    const user = await User.create({ name, email, password, farmName, location, phone });

    const token = generateToken({ id: user._id });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        farmName: user.farmName,
        location: user.location,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (!user.active) {
      return res.status(401).json({ message: 'Cuenta inactiva. Contacta al soporte.' });
    }

    const token = generateToken({ id: user._id });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        farmName: user.farmName,
        location: user.location,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// @desc    Actualizar perfil
// @route   PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, farmName, location, phone, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name;
    if (farmName) user.farmName = farmName;
    if (typeof location === 'string') user.location = location;
    if (typeof phone === 'string') user.phone = phone;
    if (password) user.password = password;

    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        farmName: user.farmName,
        location: user.location,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateMe };
