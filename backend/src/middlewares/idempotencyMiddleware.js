const { verifyToken } = require('../config/jwt');
const IdempotencyKey = require('../models/IdempotencyKey');

// Solo el alta de estos registros acepta clave de idempotencia (los que se pueden guardar sin internet)
const ALLOWED_PATHS = new Set(['/api/expenses', '/api/income', '/api/applications', '/api/household']);
const KEY_FORMAT = /^[A-Za-z0-9_-]{16,80}$/;
const STALE_AFTER_MS = 2 * 60 * 1000; // un intento "en proceso" más viejo que esto se considera abandonado

// Se monta ANTES de las rutas. No reemplaza la autenticación: si el token no sirve, sigue de largo y
// la ruta responde 401 como siempre.
const idempotency = async (req, res, next) => {
  try {
    if (req.method !== 'POST') return next();
    const key = req.get('Idempotency-Key');
    if (!key) return next();
    const path = req.originalUrl.split('?')[0].replace(/\/+$/, '');
    if (!ALLOWED_PATHS.has(path)) return next();
    if (!KEY_FORMAT.test(key)) return res.status(400).json({ message: 'Clave de reintento inválida.' });

    let actor;
    try {
      const token = (req.headers.authorization || '').split(' ')[1];
      actor = verifyToken(token).id;
    } catch {
      return next();
    }

    try {
      await IdempotencyKey.create({ actor, key, path });
    } catch (err) {
      if (err.code !== 11000) return next(err);
      const existing = await IdempotencyKey.findOne({ actor, key });
      if (existing && existing.state === 'done') {
        // Ya se procesó: se devuelve lo mismo que respondió la primera vez, sin crear nada nuevo
        res.set('Idempotent-Replay', 'true');
        return res.status(existing.status || 200).json(existing.body);
      }
      // Sigue procesándose (o quedó a medias). Si es viejo, se retoma; si no, se pide reintentar.
      const taken = await IdempotencyKey.findOneAndUpdate(
        { actor, key, state: 'processing', createdAt: { $lt: new Date(Date.now() - STALE_AFTER_MS) } },
        { $set: { createdAt: new Date() } }
      );
      if (!taken) {
        return res.status(409).json({ message: 'Ese registro se está procesando. Intenta de nuevo en unos segundos.', code: 'IDEMPOTENCY_IN_PROGRESS' });
      }
    }

    // Al responder: si salió bien se guarda la respuesta; si falló se libera la clave para poder reintentar
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const status = res.statusCode;
      const op = status >= 200 && status < 300
        ? IdempotencyKey.updateOne({ actor, key }, { $set: { state: 'done', status, body } })
        : IdempotencyKey.deleteOne({ actor, key });
      op.catch((e) => console.error('Idempotencia:', e.message));
      return originalJson(body);
    };
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = idempotency;