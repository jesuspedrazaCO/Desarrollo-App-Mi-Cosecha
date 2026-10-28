const multer = require('multer');

// Guardar en memoria (buffer) — no en disco
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else {
    const err = new Error('Tipo de archivo no permitido. Solo JPG, PNG, WEBP o PDF.');
    err.statusCode = 400;
    cb(err, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB, un archivo por petición
  fileFilter,
});

// El tipo que declara el navegador se puede falsificar. Se revisan los primeros bytes del archivo,
// que es donde cada formato dice qué es en realidad.
const startsWith = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const SIGNATURES = {
  'image/jpeg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  'image/png': (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': (b) => startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8),
  'application/pdf': (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46]),
};

const verifyFileSignature = (req, res, next) => {
  if (!req.file) return next();
  const check = SIGNATURES[req.file.mimetype];
  if (!check || !req.file.buffer || !check(req.file.buffer)) {
    return res.status(400).json({ message: 'El archivo no es válido o está dañado. Solo JPG, PNG, WEBP o PDF.' });
  }
  next();
};

// Las rutas siguen usando upload.single('campo'); ahora además revisa el contenido real del archivo.
const originalSingle = upload.single.bind(upload);
upload.single = (field) => [originalSingle(field), verifyFileSignature];

module.exports = upload;
