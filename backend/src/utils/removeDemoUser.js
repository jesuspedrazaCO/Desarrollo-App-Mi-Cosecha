// Borra la cuenta de demostración (productor@agrofinanzas.com) y todos sus datos.
//   Ver qué se borraría:   node src/utils/removeDemoUser.js
//   Borrar de verdad:      node src/utils/removeDemoUser.js --confirm
// Usa la MONGO_URI de tu .env (pon la de producción si quieres limpiar producción).
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Crop = require('../models/Crop');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const HouseholdExpense = require('../models/HouseholdExpense');
const CalendarEvent = require('../models/CalendarEvent');

const DEMO_EMAIL = 'productor@agrofinanzas.com';

(async () => {
  await connectDB();
  const user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    console.log('✅ La cuenta de demostración no existe en esta base de datos.');
    return process.exit(0);
  }
  const filter = { owner: user._id };
  const counts = {
    cultivos: await Crop.countDocuments(filter),
    gastos: await Expense.countDocuments(filter),
    ingresos: await Income.countDocuments(filter),
    gastosHogar: await HouseholdExpense.countDocuments(filter),
    eventos: await CalendarEvent.countDocuments(filter),
  };
  console.log(`Cuenta encontrada: ${user.name} <${user.email}>`, counts);
  if (!process.argv.includes('--confirm')) {
    console.log('No se borró nada. Para borrarla de verdad agrega --confirm');
    return process.exit(0);
  }
  await Promise.all([
    Crop.deleteMany(filter), Expense.deleteMany(filter), Income.deleteMany(filter),
    HouseholdExpense.deleteMany(filter), CalendarEvent.deleteMany(filter),
  ]);
  await User.deleteOne({ _id: user._id });
  console.log('🗑️  Cuenta de demostración y sus datos borrados.');
  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
