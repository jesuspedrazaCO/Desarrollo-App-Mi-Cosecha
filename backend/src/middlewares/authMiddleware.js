const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

const READ_ONLY_MESSAGE = 'Tu cuenta es de solo lectura. Pídele al administrador de la finca que haga ese cambio.';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// Verifica el token y deja en la petición:
//  - req.actor: la persona que inició sesión (su propia cuenta)
//  - req.user:  la cuenta DUEÑA de los datos. Para un administrador es él mismo; para un lector es
//               el administrador de su finca. Así todos los controladores (que filtran por req.user)
//               muestran los datos de la finca sin tener que cambiar nada.
//  - req.role:  'admin' o 'viewer'
// Un lector solo puede hacer peticiones de lectura (GET); cualquier otra se rechaza aquí, en el
// servidor, sin importar lo que muestre u oculte la pantalla.
const authenticate = (allowViewerWrites) => async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ message: 'No autorizado. Inicia sesión de nuevo.' });
    }

    const decoded = verifyToken(token);
    const actor = await User.findById(decoded.id).select('-password');
    if (!actor || !actor.active) {
      return res.status(401).json({ message: 'Usuario no encontrado o inactivo.' });
    }

    const isViewer = actor.role === 'viewer' || !!actor.farmOwner;
    if (!isViewer) {
      req.actor = actor;
      req.user = actor;
      req.role = 'admin';
      return next();
    }

    // Lector: debe tener una finca activa a la que apuntar
    const owner = actor.farmOwner ? await User.findById(actor.farmOwner).select('-password') : null;
    if (!owner || !owner.active) {
      return res.status(401).json({ message: 'La finca ya no está disponible. Contacta al administrador.' });
    }
    if (!allowViewerWrites && !SAFE_METHODS.includes(req.method)) {
      return res.status(403).json({ message: READ_ONLY_MESSAGE, code: 'READ_ONLY' });
    }

    req.actor = actor;
    req.user = owner;
    req.role = 'viewer';
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sesión inválida o expirada. Inicia sesión de nuevo.' });
  }
};

// Uso normal: los lectores solo pueden leer
const protect = authenticate(false);
// Solo para que cada persona edite SU propio perfil (nombre, foto, contraseña), también los lectores
const protectSelf = authenticate(true);

// Rutas solo para el administrador de la finca (ej: invitar miembros)
const adminOnly = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ message: 'Solo el administrador de la finca puede hacer esto.', code: 'ADMIN_ONLY' });
  }
  next();
};

module.exports = { protect, protectSelf, adminOnly };