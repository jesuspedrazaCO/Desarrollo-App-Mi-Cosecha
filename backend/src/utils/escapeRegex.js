// Convierte lo que escribe el usuario en texto literal para usarlo dentro de un $regex (evita regex maliciosas).
const escapeRegex = (text) => String(text).slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
