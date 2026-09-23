require('dotenv').config();
const mongoose = require('mongoose');
const Income = require('../models/Income');

const TYPE_LABELS = {
  venta_cosecha: 'Venta de cosecha',
  venta_parcial: 'Venta parcial',
  otro: 'Otro',
};

const migrate = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB. Buscando ingresos sin desglose por producto...');

  const incomes = await Income.find({
    $or: [{ items: { $exists: false } }, { items: { $size: 0 } }],
  });

  console.log(`Encontrados ${incomes.length} ingresos para revisar.`);

  let migrated = 0;
  for (const income of incomes) {
    if (!income.totalAmount) continue; // nada que agrupar

    income.items = [
      {
        variety: TYPE_LABELS[income.type] || 'Venta',
        quantitySold: income.quantitySold || 0,
        unit: income.unit || 'kg',
        crates: 0,
        salePrice: income.salePrice || 0,
        subtotal: income.totalAmount, // se conserva el total original tal cual
      },
    ];

    await income.save();
    migrated++;
  }

  console.log(`Migración completa: ${migrated} ingresos convertidos a items[].`);
  await mongoose.disconnect();
};

migrate().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});