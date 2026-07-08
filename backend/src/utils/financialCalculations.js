// Utilidades de cálculo financiero compartidas entre dashboard y reportes.

/**
 * Calcula el resumen financiero de un cultivo dado su total invertido y total vendido.
 */
const calculateCropSummary = (totalInvested = 0, totalSold = 0) => {
  const netProfit = totalSold - totalInvested;
  
  // CORRECCIÓN: Si no hay inversión pero sí hay ventas, la rentabilidad es del 100%
  const profitability = totalInvested > 0 
    ? (netProfit / totalInvested) * 100 
    : (totalSold > 0 ? 100 : 0);

  return {
    totalInvested,
    totalSold,
    netProfit,
    profitability: Math.round(profitability * 100) / 100,
    isProfit: netProfit >= 0,
  };
};

/**
 * Agrupa un arreglo de documentos con campo `date` y un campo numérico
 * por mes (YYYY-MM), sumando los valores overseas.
 */
const groupByMonth = (items, amountField) => {
  const groups = {};
  items.forEach((item) => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = 0;
    groups[key] += item[amountField] || 0;
  });
  return Object.entries(groups)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Agrupa un arreglo de documentos por categoría, sumando un campo numérico.
 */
const groupByCategory = (items, amountField) => {
  const groups = {};
  items.forEach((item) => {
    const key = item.category || 'Otros';
    if (!groups[key]) groups[key] = 0;
    groups[key] += item[amountField] || 0;
  });
  return Object.entries(groups).map(([category, total]) => ({ category, total }));
};

module.exports = {
  calculateCropSummary,
  groupByMonth,
  groupByCategory,
};