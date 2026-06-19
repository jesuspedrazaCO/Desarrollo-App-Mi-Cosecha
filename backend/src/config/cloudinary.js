// Configuración opcional de Cloudinary para almacenamiento de imágenes en producción.
// Mientras el proyecto corre local, los archivos se guardan en src/uploads (ver uploadMiddleware.js).
// Para activar Cloudinary en producción:
// 1. npm install cloudinary
// 2. Crear cuenta gratis en cloudinary.com
// 3. Agregar CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET al .env
// 4. Descomentar el código abajo y usarlo en uploadMiddleware.js

/*
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
*/

module.exports = null;
