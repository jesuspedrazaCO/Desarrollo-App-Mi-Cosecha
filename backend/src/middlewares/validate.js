const { validationResult } = require('express-validator');

// Middleware genérico: revisa los resultados de express-validator
// y devuelve un error 400 con el primer mensaje si hay errores.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = { validate };
