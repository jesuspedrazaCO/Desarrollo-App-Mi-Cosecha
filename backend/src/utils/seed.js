require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Crop = require('../models/Crop');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const HouseholdExpense = require('../models/HouseholdExpense');
const CalendarEvent = require('../models/CalendarEvent');

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Crop.deleteMany({}),
    Expense.deleteMany({}),
    Income.deleteMany({}),
    HouseholdExpense.deleteMany({}),
    CalendarEvent.deleteMany({}),
  ]);

  const user = await User.create({
    name: 'Don Carlos Pérez',
    email: 'productor@agrofinanzas.com',
    password: 'agro123',
    farmName: 'Finca La Esperanza',
    location: 'Vereda El Recreo, Santander',
    phone: '3001234567',
  });

  const pina = await Crop.create({
    owner: user._id,
    name: 'Piña Lote 1',
    type: 'Piña',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    estimatedHarvestDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    location: 'Lote norte',
    landSize: 2,
    landSizeUnit: 'hectáreas',
    status: 'activo',
    observations: 'Cultivo principal de la finca.',
  });

  const tomate = await Crop.create({
    owner: user._id,
    name: 'Tomate Invernadero',
    type: 'Tomate',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
    estimatedHarvestDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    location: 'Invernadero 1',
    landSize: 0.5,
    landSizeUnit: 'hectáreas',
    status: 'activo',
  });

  await Expense.create([
    { owner: user._id, crop: pina._id, date: new Date(), description: 'Compra de semillas de piña', category: 'semillas', amount: 800000, paymentMethod: 'efectivo' },
    { owner: user._id, crop: pina._id, date: new Date(), description: 'Fertilizante NPK', category: 'fertilizantes', amount: 350000, paymentMethod: 'efectivo' },
    { owner: user._id, crop: pina._id, date: new Date(), description: 'Mano de obra deshierbe', category: 'mano_de_obra', amount: 450000, paymentMethod: 'efectivo' },
    { owner: user._id, crop: tomate._id, date: new Date(), description: 'Plántulas de tomate', category: 'semillas', amount: 400000, paymentMethod: 'efectivo' },
    { owner: user._id, crop: tomate._id, date: new Date(), description: 'Sistema de riego', category: 'riego', amount: 600000, paymentMethod: 'tarjeta' },
  ]);

  await Income.create([
    { owner: user._id, crop: pina._id, date: new Date(), type: 'venta_parcial', client: 'Distribuidora Frutas del Valle', quantitySold: 500, unit: 'unidades', salePrice: 2500, totalAmount: 1250000 },
  ]);

  await HouseholdExpense.create([
    { owner: user._id, date: new Date(), category: 'mercado', description: 'Mercado semanal', amount: 180000, paymentMethod: 'efectivo' },
    { owner: user._id, date: new Date(), category: 'energia', description: 'Factura de energía', amount: 95000, paymentMethod: 'transferencia' },
    { owner: user._id, date: new Date(), category: 'agua', description: 'Factura de acueducto', amount: 45000, paymentMethod: 'transferencia' },
  ]);

  const inFiveDays = new Date(); inFiveDays.setDate(inFiveDays.getDate() + 5);
  const inTenDays = new Date(); inTenDays.setDate(inTenDays.getDate() + 10);

  await CalendarEvent.create([
    { owner: user._id, crop: pina._id, title: 'Cosecha parcial de piña', type: 'cosecha', date: inTenDays, notes: 'Coordinar transporte' },
    { owner: user._id, title: 'Pago factura de energía', type: 'pago_pendiente', date: inFiveDays, amount: 95000 },
  ]);

  console.log('✅ Datos de prueba creados:');
  console.log('   Usuario  → productor@agrofinanzas.com / agro123');
  console.log('   Finca    → Finca La Esperanza');
  console.log('   Cultivos → Piña Lote 1, Tomate Invernadero');

  mongoose.connection.close();
};

seed();