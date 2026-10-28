// Avisos de seguridad al arrancar. Solo avisan en el log (no apagan el servidor para no dejar la app caída).
const checkEnv = () => {
  const warnings = [];
  const secret = process.env.JWT_SECRET || '';
  if (!secret) warnings.push('JWT_SECRET no está definida.');
  else if (secret.length < 32 || /cambia|secret|changeme|1234|password/i.test(secret)) {
    warnings.push('JWT_SECRET es corta o parece de ejemplo: cualquiera podría fabricar sesiones. Usa 48+ caracteres aleatorios.');
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) warnings.push('FRONTEND_URL no está definida: CORS quedará limitado a localhost.');
    if (!process.env.MONGO_URI) warnings.push('MONGO_URI no está definida.');
  }
  warnings.forEach((w) => console.error(`⚠️  SEGURIDAD: ${w}`));
};

module.exports = checkEnv;
