// Limpia lo que llega en el cuerpo y en la URL antes de que toque la base de datos.
//  - Quita claves que empiezan por "$" o traen "." (así nadie puede colar operadores de MongoDB como {"$ne": null}).
//  - Quita campos que solo el servidor debe poner (owner, _id, fechas), para que nadie reasigne un registro a otra cuenta.
//  - Acota "limit" y "page" para que nadie pida millones de registros de una vez.
const SERVER_ONLY_FIELDS = ['owner', '_id', '__v', 'createdAt', 'updatedAt'];

const stripOperators = (value, depth = 0) => {
  if (depth > 12 || value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item) => stripOperators(item, depth + 1));
    return;
  }
  Object.keys(value).forEach((key) => {
    if (key.startsWith('$') || key.includes('.')) delete value[key];
    else stripOperators(value[key], depth + 1);
  });
};

const clampInt = (raw, min, max, fallback) => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    stripOperators(req.body);
    if (!Array.isArray(req.body)) SERVER_ONLY_FIELDS.forEach((f) => delete req.body[f]);
  }
  if (req.query && typeof req.query === 'object') {
    stripOperators(req.query);
    if (req.query.limit !== undefined) req.query.limit = String(clampInt(req.query.limit, 1, 500, 50));
    if (req.query.page !== undefined) req.query.page = String(clampInt(req.query.page, 1, 100000, 1));
  }
  next();
};

module.exports = { sanitizeInput, stripOperators };
