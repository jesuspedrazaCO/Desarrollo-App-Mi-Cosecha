const errorHandler = (err, req, res, next) => {
  console.error('ERROR:', err.message);

  // Error de duplicado MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(400).json({ message: `Ya existe un registro con ese ${field}.` });
  }

  // Error de validación Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join('. ') });
  }

  // Error de cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID inválido.' });
  }

  // Error de Multer (archivos)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 5MB.' });
    }
    return res.status(400).json({ message: `Error al subir archivo: ${err.message}` });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Error interno del servidor.',
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
