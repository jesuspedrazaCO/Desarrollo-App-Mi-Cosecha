// Middleware: normaliza campos de fecha tipo "YYYY-MM-DD" a mediodía local
// para evitar que se "corra" un día por conversión UTC al guardarse en MongoDB.
const normalizeDateFields = (fields) => (req, res, next) => {
  fields.forEach((field) => {
    const value = req.body[field];
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      req.body[field] = `${value}T12:00:00`;
    }
  });
  next();
};

module.exports = { normalizeDateFields };
