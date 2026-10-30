// Cálculos de rentabilidad por cultivo (funciones puras, sin base de datos).
const { calculateCropSummary, groupByCategory } = require('./financialCalculations');

// Hectáreas que equivale una unidad de terreno. Cuadra y fanegada se usan como 0.64 ha (valor de referencia común en Colombia).
const HA_PER_UNIT = { hectáreas: 1, metros2: 0.0001, cuadras: 0.64, fanegadas: 0.64 };

const toHectares = (size = 0, unit = 'hectáreas') => (Number(size) || 0) * (HA_PER_UNIT[unit] ?? 1);

// Productos de una venta; compatible con ventas antiguas sin items[].
const incomeItems = (income) => {
  if (Array.isArray(income.items) && income.items.length > 0) return income.items;
  if (income.quantitySold > 0) {
    return [{ variety: 'Venta', quantitySold: income.quantitySold, unit: income.unit || 'kg', salePrice: income.salePrice }];
  }
  return [];
};

const itemSubtotal = (it) => it.subtotal ?? (Number(it.quantitySold) || 0) * (Number(it.salePrice) || 0);

const monthKey = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const round = (n, d = 2) => {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
};

/**
 * @param crop      documento del cultivo (name, type, status, landSize, landSizeUnit, startDate...)
 * @param expenses  gastos del cultivo
 * @param incomes   ingresos (ventas) del cultivo
 */
const buildCropProfitability = (crop, expenses = [], incomes = []) => {
  const invested = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const sold = incomes.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const base = calculateCropSummary(invested, sold);

  // Kilos vendidos y lo recaudado por esos kilos (para precio promedio y costo por kilo).
  let kgSold = 0;
  let kgRevenue = 0;
  const products = {};
  incomes.forEach((inc) => {
    incomeItems(inc).forEach((it) => {
      const unit = (it.unit || 'kg').trim().toLowerCase();
      const qty = Number(it.quantitySold) || 0;
      const amount = itemSubtotal(it) || 0;
      if (unit === 'kg') {
        kgSold += qty;
        kgRevenue += amount;
      }
      const key = `${it.variety || 'Sin variedad'}|${unit}`;
      if (!products[key]) products[key] = { variety: it.variety || 'Sin variedad', unit, quantity: 0, amount: 0 };
      products[key].quantity += qty;
      products[key].amount += amount;
    });
  });

  const costPerKg = kgSold > 0 ? invested / kgSold : null;
  const avgPricePerKg = kgSold > 0 ? kgRevenue / kgSold : null;
  const margin = sold > 0 ? (base.netProfit / sold) * 100 : null;
  // Con el precio promedio actual, cuántos kilos hacen falta para cubrir lo invertido.
  const breakEvenKg = avgPricePerKg && avgPricePerKg > 0 ? invested / avgPricePerKg : null;

  const hectares = toHectares(crop.landSize, crop.landSizeUnit);
  const perHectare = hectares > 0
    ? { invested: invested / hectares, sold: sold / hectares, netProfit: base.netProfit / hectares }
    : null;

  // Por mata: solo si el cultivo tiene registrado cuántas plantas hay.
  const plants = Number(crop.plantCount) || 0;
  const perPlant = plants > 0
    ? {
        invested: round(invested / plants, 0),
        sold: round(sold / plants, 0),
        netProfit: round(base.netProfit / plants, 0),
        kg: kgSold > 0 ? round(kgSold / plants, 2) : null,
      }
    : null;

  // Gastos por categoría, con porcentaje.
  const byCategory = groupByCategory(expenses, 'amount')
    .map((c) => ({ ...c, percent: invested > 0 ? round((c.total / invested) * 100, 1) : 0 }))
    .sort((a, b) => b.total - a.total);

  // Flujo mensual: gastos, ventas, neto y acumulado.
  const months = {};
  expenses.forEach((e) => {
    const k = monthKey(e.date);
    months[k] = months[k] || { month: k, expenses: 0, income: 0 };
    months[k].expenses += e.amount || 0;
  });
  incomes.forEach((i) => {
    const k = monthKey(i.date);
    months[k] = months[k] || { month: k, expenses: 0, income: 0 };
    months[k].income += i.totalAmount || 0;
  });
  // Incluye los meses intermedios sin movimiento (en cero) para que la línea del tiempo sea continua.
  const sortedKeys = Object.keys(months).sort();
  if (sortedKeys.length > 1) {
    let [y, mo] = sortedKeys[0].split('-').map(Number);
    const [ly, lmo] = sortedKeys[sortedKeys.length - 1].split('-').map(Number);
    let guard = 0;
    while ((y < ly || (y === ly && mo <= lmo)) && guard++ < 240) {
      const k = `${y}-${String(mo).padStart(2, '0')}`;
      months[k] = months[k] || { month: k, expenses: 0, income: 0 };
      mo += 1;
      if (mo > 12) { mo = 1; y += 1; }
    }
  }
  let acc = 0;
  let recoveredMonth = null;
  const monthly = Object.values(months)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => {
      const net = m.income - m.expenses;
      acc += net;
      if (recoveredMonth === null && acc >= 0 && m.income > 0) recoveredMonth = m.month;
      return { ...m, net, cumulative: acc };
    });

  // Lectura en palabras para quien no lee tablas.
  let verdict = 'sin_datos';
  if (invested > 0 || sold > 0) {
    if (base.netProfit < 0) verdict = sold > 0 ? 'por_recuperar' : 'sin_ventas';
    else verdict = base.profitability >= 30 ? 'muy_rentable' : 'rentable';
  }

  return {
    crop: {
      _id: crop._id,
      name: crop.name,
      type: crop.type,
      status: crop.status,
      location: crop.location || '',
      landSize: crop.landSize || 0,
      landSizeUnit: crop.landSizeUnit || 'hectáreas',
      plantCount: plants,
      startDate: crop.startDate,
      estimatedHarvestDate: crop.estimatedHarvestDate,
    },
    totalInvested: invested,
    totalSold: sold,
    netProfit: base.netProfit,
    roi: base.profitability, // % sobre lo invertido
    margin: margin === null ? null : round(margin, 1), // % sobre lo vendido
    kgSold: round(kgSold, 1),
    avgPricePerKg: avgPricePerKg === null ? null : round(avgPricePerKg, 0),
    costPerKg: costPerKg === null ? null : round(costPerKg, 0),
    breakEvenKg: breakEvenKg === null ? null : round(breakEvenKg, 1),
    hectares: round(hectares, 3),
    perHectare: perHectare && {
      invested: round(perHectare.invested, 0),
      sold: round(perHectare.sold, 0),
      netProfit: round(perHectare.netProfit, 0),
    },
    plants,
    perPlant,
    byCategory,
    monthly,
    recoveredMonth,
    products: Object.values(products).sort((a, b) => b.amount - a.amount),
    expenseCount: expenses.length,
    saleCount: incomes.length,
    verdict,
  };
};

const buildTotals = (rows) => {
  const invested = rows.reduce((s, r) => s + r.totalInvested, 0);
  const sold = rows.reduce((s, r) => s + r.totalSold, 0);
  const net = sold - invested;
  return {
    totalInvested: invested,
    totalSold: sold,
    netProfit: net,
    roi: invested > 0 ? round((net / invested) * 100, 2) : sold > 0 ? 100 : 0,
    margin: sold > 0 ? round((net / sold) * 100, 1) : null,
    crops: rows.length,
  };
};

module.exports = { buildCropProfitability, buildTotals, toHectares };
