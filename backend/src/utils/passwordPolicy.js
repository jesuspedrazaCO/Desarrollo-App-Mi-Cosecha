const { body } = require('express-validator');

// Contraseñas que aparecen en todas las listas de filtraciones: se rechazan aunque tengan 8 caracteres.
const COMMON = new Set([
  '12345678', '123456789', '1234567890', '12341234', '11111111', '00000000', '87654321', '123123123',
  'password', 'password1', 'password123', 'contrasena', 'contraseña', 'contrasena1', 'contraseña1',
  'qwertyui', 'qwerty123', 'qwertyuiop', 'abcd1234', 'abc12345', 'iloveyou', 'admin123', 'administrador',
  'colombia', 'colombia1', 'colombia123', 'bucaramanga', 'santander', 'santander1',
  'agro1234', 'agro12345', 'agrofinanzas', 'agrofinanzas1', 'agrofinanzas123', 'micosecha', 'micosecha123',
  'productor', 'productor1', 'campesino', 'cosecha123', 'finca123',
  'unodostres', 'a1b2c3d4', 'letmein1', 'welcome1', 'football', 'mypassword',
]);

const passwordRules = (field = 'password') =>
  body(field)
    .isString().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .isLength({ max: 72 }).withMessage('La contraseña no puede pasar de 72 caracteres')
    .custom((value) => {
      const v = String(value).trim().toLowerCase();
      if (COMMON.has(v) || /^(.)\1+$/.test(v)) {
        throw new Error('Esa contraseña es muy común y fácil de adivinar. Elige otra.');
      }
      return true;
    });

module.exports = { passwordRules };
