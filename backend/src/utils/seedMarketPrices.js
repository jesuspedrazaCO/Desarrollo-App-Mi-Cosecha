// Seed de precios reales — Centroabastos Bucaramanga, 30/06/2026
// Para actualizar: backend/src/utils/seedMarketPrices.js -> npm run seed:prices
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const MarketPrice = require('../models/MarketPrice');

const categorize = (name) => {
  const n = name.toLowerCase();
  if (/aguacate|piña|mango|mandarina|naranja|limón|limon|pera|manzana|maracuy|guayaba|papaya|melón|melon|sandía|sandia|patilla|fresa|mora|lulo|guanábana|guanabana|tomate de árbol|tomate árbol|banano|plátano|platano|guineo|uva|arándano|arandano|pitahaya|agras|badea|breva|ciruela|coco|curuba|durazno|freijoa|granadilla|kiwi|borojó|borojo|tamarindo/.test(n)) return 'frutas';
  if (/papa|yuca|arracacha|apio|zanahoria|remolacha|rábano|rabano|ñame|name|mazorca/.test(n)) return 'tuberculos';
  if (/cebolla|tomate(?! de árbol)(?! árbol)|pimentón|pimenton|repollo|lechuga|coliflor|brócoli|brocoli|espinaca|acelga|pepino|ahuyama|habichuela|arveja|frijol|calabacín|calabacin|berenjena|perejil|cilantro|ajo/.test(n)) return 'verduras';
  if (/arroz|maíz|maiz|lenteja|garbanzo|avena|trigo|harina/.test(n)) return 'granos';
  if (/leche|queso|huevo|mantequilla|yogur/.test(n)) return 'lacteos';
  if (/aceite|panela|azúcar|azucar|sal|chocolate|café|cafe|atún|atun|sardina/.test(n)) return 'procesados';
  if (/carne|pollo|pechuga|res\b/.test(n)) return 'carnes';
  if (/bagre|bocachico|cachama|camarón|camaron|dorada|mojarra|salmon|salmón|coporo/.test(n)) return 'pescados';
  return 'otros';
};

// Datos reales recolectados de https://preciosnub.centroabastos.com (30/06/2026)
const products = [
  // Frutas
  { product: 'Aguacate Choquette', presentation: 'Kilogramo', currentPrice: 8000, previousPrice: 8000, pricePerKg: 8000, trend: 'igual', variationPct: 0 },
  { product: 'Aguacate Hass', presentation: 'Kilogramo', currentPrice: 7000, previousPrice: 7000, pricePerKg: 7000, trend: 'igual', variationPct: 0 },
  { product: 'Aguacate Tolima (papelillo)', presentation: 'Kilogramo', currentPrice: 10000, previousPrice: 9000, pricePerKg: 10000, trend: 'subio', variationPct: 11.1 },
  { product: 'Agras', presentation: 'Bandeja 60gr', currentPrice: 1500, previousPrice: 1500, pricePerKg: 25000, trend: 'igual', variationPct: 0 },
  { product: 'Arándano', presentation: 'Bandeja 136 gr.', currentPrice: 6000, previousPrice: 6000, pricePerKg: 6000, trend: 'igual', variationPct: 0 },
  { product: 'Badea', presentation: 'Huacal 20 kg', currentPrice: 70000, previousPrice: 70000, pricePerKg: 3500, trend: 'igual', variationPct: 0 },
  { product: 'Banano criollo', presentation: 'Caja 20 kg', currentPrice: 33000, previousPrice: 33000, pricePerKg: 1650, trend: 'igual', variationPct: 0 },
  { product: 'Banano Quindio', presentation: 'Kilogramo', currentPrice: 2800, previousPrice: 2800, pricePerKg: 2800, trend: 'igual', variationPct: 0 },
  { product: 'Banano Urabá', presentation: 'Caja 20 kg', currentPrice: 45000, previousPrice: 45000, pricePerKg: 2250, trend: 'igual', variationPct: 0 },
  { product: 'Borojó', presentation: 'Kilogramo', currentPrice: 5500, previousPrice: 5500, pricePerKg: 5500, trend: 'igual', variationPct: 0 },
  { product: 'Breva', presentation: 'Kilogramo', currentPrice: 6000, previousPrice: 6000, pricePerKg: 6000, trend: 'igual', variationPct: 0 },
  { product: 'Ciruela (criolla)', presentation: 'Arroba 12,5 kg', currentPrice: 35000, previousPrice: 35000, pricePerKg: 2800, trend: 'igual', variationPct: 0 },
  { product: 'Ciruela Importada', presentation: 'Caja 10 kg', currentPrice: 115000, previousPrice: 115000, pricePerKg: 11500, trend: 'igual', variationPct: 0 },
  { product: 'Coco', presentation: 'Unidad', currentPrice: 5000, previousPrice: 5000, pricePerKg: 5000, trend: 'igual', variationPct: 0 },
  { product: 'Curuba castilla', presentation: 'Canastilla 25 kg', currentPrice: 80000, previousPrice: 90000, pricePerKg: 3200, trend: 'bajo', variationPct: 11.1 },
  { product: 'Durazno criollo', presentation: 'Caja 10kg', currentPrice: 70000, previousPrice: 75000, pricePerKg: 7000, trend: 'bajo', variationPct: 6.7 },
  { product: 'Freijoa', presentation: 'Kilogramo', currentPrice: 5000, previousPrice: 5000, pricePerKg: 5000, trend: 'igual', variationPct: 0 },
  { product: 'Fresa Criolla', presentation: 'Kilogramo', currentPrice: 10000, previousPrice: 10000, pricePerKg: 10000, trend: 'igual', variationPct: 0 },
  { product: 'Granadilla', presentation: 'Caja 12.5 kg', currentPrice: 150000, previousPrice: 150000, pricePerKg: 12000, trend: 'igual', variationPct: 0 },
  { product: 'Guanábana', presentation: 'Kilogramo', currentPrice: 3500, previousPrice: 3500, pricePerKg: 3500, trend: 'igual', variationPct: 0 },
  { product: 'Guayaba Pera', presentation: 'Canastilla 25kg', currentPrice: 50000, previousPrice: 40000, pricePerKg: 2000, trend: 'subio', variationPct: 25 },
  { product: 'Guineo', presentation: 'Kilogramo', currentPrice: 3000, previousPrice: 3000, pricePerKg: 3000, trend: 'igual', variationPct: 0 },
  { product: 'Kiwi', presentation: 'Caja 10 kg', currentPrice: 140000, previousPrice: 140000, pricePerKg: 14000, trend: 'igual', variationPct: 0 },
  { product: 'Limón Común', presentation: 'Canastilla 23kg', currentPrice: 85000, previousPrice: 85000, pricePerKg: 3696, trend: 'igual', variationPct: 0 },
  { product: 'Limón tahití', presentation: 'Canastilla 23kg', currentPrice: 35000, previousPrice: 25000, pricePerKg: 1522, trend: 'subio', variationPct: 40 },
  { product: 'Lulo Criollo', presentation: 'Canastilla 25kg', currentPrice: 140000, previousPrice: 140000, pricePerKg: 5600, trend: 'igual', variationPct: 0 },
  { product: 'Mandarina', presentation: 'Canastilla 25 kg', currentPrice: 90000, previousPrice: 80000, pricePerKg: 3600, trend: 'subio', variationPct: 12.5 },
  { product: 'Mango de Azúcar (Remesido)', presentation: 'Canastilla 25 kg', currentPrice: 160000, previousPrice: 160000, pricePerKg: 6400, trend: 'igual', variationPct: 0 },
  { product: 'Mango tommy(nacional)', presentation: 'Canastilla 25 kg', currentPrice: 150000, previousPrice: 150000, pricePerKg: 6000, trend: 'igual', variationPct: 0 },
  { product: 'Manzana roja', presentation: 'Caja 20 kg', currentPrice: 170000, previousPrice: 170000, pricePerKg: 8500, trend: 'igual', variationPct: 0 },
  { product: 'Maracuyá', presentation: 'Bulto 30 kg', currentPrice: 100000, previousPrice: 100000, pricePerKg: 3333, trend: 'igual', variationPct: 0 },
  { product: 'Melón', presentation: 'Kilogramo', currentPrice: 3000, previousPrice: 3000, pricePerKg: 3000, trend: 'igual', variationPct: 0 },
  { product: 'Mora Castilla', presentation: 'Caja 8kg', currentPrice: 65000, previousPrice: 65000, pricePerKg: 8125, trend: 'igual', variationPct: 0 },
  { product: 'Naranja granjera', presentation: 'Canastilla 25 kg', currentPrice: 60000, previousPrice: 60000, pricePerKg: 2400, trend: 'igual', variationPct: 0 },
  { product: 'Naranja Tangelo', presentation: 'Canastilla 25kg', currentPrice: 120000, previousPrice: 90000, pricePerKg: 4800, trend: 'subio', variationPct: 33.3 },
  { product: 'Naranja Valencia', presentation: 'Bulto 25kg', currentPrice: 45000, previousPrice: 40000, pricePerKg: 1800, trend: 'subio', variationPct: 12.5 },
  { product: 'Papaya Maradol', presentation: 'Kilogramo', currentPrice: 2300, previousPrice: 2300, pricePerKg: 2300, trend: 'igual', variationPct: 0 },
  { product: 'Patilla baby', presentation: 'Kilogramo', currentPrice: 2200, previousPrice: 2200, pricePerKg: 2200, trend: 'igual', variationPct: 0 },
  { product: 'Patilla royal', presentation: 'Kilogramo', currentPrice: 2400, previousPrice: 2400, pricePerKg: 2400, trend: 'igual', variationPct: 0 },
  { product: 'Pera criolla', presentation: 'Canastilla 25 kg', currentPrice: 60000, previousPrice: 55000, pricePerKg: 2400, trend: 'subio', variationPct: 9.1 },
  { product: 'Pitahaya', presentation: 'Kilogramo', currentPrice: 10000, previousPrice: 10000, pricePerKg: 10000, trend: 'igual', variationPct: 0 },
  { product: 'Piña Golden', presentation: 'Kilogramo', currentPrice: 2200, previousPrice: 2200, pricePerKg: 2200, trend: 'igual', variationPct: 0 },
  { product: 'Piña perolera', presentation: 'Huacal 30kg', currentPrice: 70000, previousPrice: 60000, pricePerKg: 2333, trend: 'subio', variationPct: 16.7 },
  { product: 'Plátano Ecuador', presentation: 'Caja 30 kg', currentPrice: 75000, previousPrice: 75000, pricePerKg: 2500, trend: 'igual', variationPct: 0 },
  { product: 'Plátano Urabá', presentation: 'Caja 25 kg', currentPrice: 90000, previousPrice: 90000, pricePerKg: 3600, trend: 'igual', variationPct: 0 },
  { product: 'Tamarindo', presentation: 'Kilogramo', currentPrice: 7000, previousPrice: 7000, pricePerKg: 7000, trend: 'igual', variationPct: 0 },

  // Verduras y hortalizas
  { product: 'Ahuyama', presentation: 'Kilogramo', currentPrice: 1000, previousPrice: 1000, pricePerKg: 1000, trend: 'igual', variationPct: 0 },
  { product: 'Ajo criollo', presentation: 'Atado 9 kg', currentPrice: 55000, previousPrice: 55000, pricePerKg: 6111, trend: 'igual', variationPct: 0 },
  { product: 'Ajo importado', presentation: 'Caja 10,0 kg', currentPrice: 55000, previousPrice: 60000, pricePerKg: 5500, trend: 'bajo', variationPct: 8.3 },
  { product: 'Apio en rama (Bogotana)', presentation: 'Rama', currentPrice: 3000, previousPrice: 2500, pricePerKg: 3000, trend: 'subio', variationPct: 20 },
  { product: 'Arveja Ipiales', presentation: 'Bulto 50kg', currentPrice: 250000, previousPrice: 280000, pricePerKg: 5000, trend: 'bajo', variationPct: 10.7 },
  { product: 'Berenjena', presentation: 'Libras', currentPrice: 2000, previousPrice: 2000, pricePerKg: 4000, trend: 'igual', variationPct: 0 },
  { product: 'Brócoli', presentation: 'Kilogramo', currentPrice: 8000, previousPrice: 5000, pricePerKg: 8000, trend: 'subio', variationPct: 60 },
  { product: 'Calabacín', presentation: 'Libras', currentPrice: 2000, previousPrice: 2000, pricePerKg: 4000, trend: 'igual', variationPct: 0 },
  { product: 'Cebolla Cab Roja Ocañera', presentation: 'Bulto 50kg', currentPrice: 145000, previousPrice: 145000, pricePerKg: 2900, trend: 'igual', variationPct: 0 },
  { product: 'Cebolla cab. roja peruana', presentation: 'Bulto 46 kg', currentPrice: 130000, previousPrice: 130000, pricePerKg: 2826, trend: 'igual', variationPct: 0 },
  { product: 'Cebolla cabezona Blanca', presentation: 'Bulto 50 kg', currentPrice: 120000, previousPrice: 120000, pricePerKg: 2400, trend: 'igual', variationPct: 0 },
  { product: 'Cebolla Junca Berlin', presentation: 'Bulto 30kg', currentPrice: 80000, previousPrice: 90000, pricePerKg: 2667, trend: 'bajo', variationPct: 11.1 },
  { product: 'Cilantro', presentation: 'Atado', currentPrice: 11000, previousPrice: 11000, pricePerKg: 11000, trend: 'igual', variationPct: 0 },
  { product: 'Coliflor', presentation: 'Kilogramo', currentPrice: 8000, previousPrice: 6000, pricePerKg: 8000, trend: 'subio', variationPct: 33.3 },
  { product: 'Espinacas', presentation: 'Kilogramo', currentPrice: 7000, previousPrice: 5000, pricePerKg: 7000, trend: 'subio', variationPct: 40 },
  { product: 'Frijol seco', presentation: 'Libra 500 gr.', currentPrice: 3900, previousPrice: 3900, pricePerKg: 7800, trend: 'igual', variationPct: 0 },
  { product: 'Frijol Verde', presentation: 'Bulto 50kg', currentPrice: 220000, previousPrice: 180000, pricePerKg: 4400, trend: 'subio', variationPct: 22.2 },
  { product: 'Habichuela', presentation: 'Bulto 20kg', currentPrice: 50000, previousPrice: 60000, pricePerKg: 2500, trend: 'bajo', variationPct: 16.7 },
  { product: 'Lechuga (Bogotana)', presentation: 'Unidad', currentPrice: 3000, previousPrice: 2000, pricePerKg: 3000, trend: 'subio', variationPct: 50 },
  { product: 'Lechuga batavia', presentation: 'Caja de madera', currentPrice: 18000, previousPrice: 18000, pricePerKg: 1500, trend: 'igual', variationPct: 0 },
  { product: 'Lechuga crespa verde', presentation: 'Bolsa 500 gr', currentPrice: 1500, previousPrice: 1500, pricePerKg: 3000, trend: 'igual', variationPct: 0 },
  { product: 'Mazorca', presentation: 'Bulto 80 kg', currentPrice: 110000, previousPrice: 110000, pricePerKg: 1375, trend: 'igual', variationPct: 0 },
  { product: 'Pepino Cohombro', presentation: 'Bulto 25kg', currentPrice: 30000, previousPrice: 25000, pricePerKg: 1200, trend: 'subio', variationPct: 20 },
  { product: 'Pepino de rellenar', presentation: 'Docena', currentPrice: 5000, previousPrice: 5000, pricePerKg: 5000, trend: 'igual', variationPct: 0 },
  { product: 'Perejil', presentation: 'Atado/manojo', currentPrice: 4000, previousPrice: 3000, pricePerKg: 4000, trend: 'subio', variationPct: 33.3 },
  { product: 'Pimentón Rojo', presentation: 'Canastilla 13kg', currentPrice: 35000, previousPrice: 35000, pricePerKg: 2692, trend: 'igual', variationPct: 0 },
  { product: 'Pimentón verde', presentation: 'Canastilla 13 kg', currentPrice: 25000, previousPrice: 25000, pricePerKg: 1923, trend: 'igual', variationPct: 0 },
  { product: 'Rábano', presentation: 'Kilogramo', currentPrice: 6000, previousPrice: 6000, pricePerKg: 6000, trend: 'igual', variationPct: 0 },
  { product: 'Remolacha', presentation: 'Bulto 50kg', currentPrice: 70000, previousPrice: 60000, pricePerKg: 1400, trend: 'subio', variationPct: 16.7 },
  { product: 'Repollo blanco', presentation: 'Bulto 62.5 kg', currentPrice: 60000, previousPrice: 50000, pricePerKg: 960, trend: 'subio', variationPct: 20 },
  { product: 'Repollo morado', presentation: 'Kilogramo', currentPrice: 2500, previousPrice: 2000, pricePerKg: 2500, trend: 'subio', variationPct: 25 },
  { product: 'Tomate árbol Bogotá', presentation: 'Canastilla 25 kg', currentPrice: 110000, previousPrice: 110000, pricePerKg: 4400, trend: 'igual', variationPct: 0 },
  { product: 'Tomate milano', presentation: 'Canastilla 20 kg', currentPrice: 80000, previousPrice: 80000, pricePerKg: 4000, trend: 'igual', variationPct: 0 },
  { product: 'Tomate Rio Grande', presentation: 'Canastilla 23kg', currentPrice: 50000, previousPrice: 60000, pricePerKg: 2174, trend: 'bajo', variationPct: 16.7 },

  // Tubérculos
  { product: 'Apio Arracacha', presentation: 'Bulto 60kg', currentPrice: 180000, previousPrice: 180000, pricePerKg: 3000, trend: 'igual', variationPct: 0 },
  { product: 'Papa Amarilla', presentation: 'Bulto 50 kg', currentPrice: 200000, previousPrice: 220000, pricePerKg: 4000, trend: 'bajo', variationPct: 9.1 },
  { product: 'Papa pastusa', presentation: 'Bulto 50 kg', currentPrice: 85000, previousPrice: 85000, pricePerKg: 1700, trend: 'igual', variationPct: 0 },
  { product: 'Papa superior', presentation: 'Bulto 50 kg', currentPrice: 85000, previousPrice: 88000, pricePerKg: 1700, trend: 'bajo', variationPct: 3.4 },
  { product: 'Papa Única', presentation: 'Bulto 50 kg', currentPrice: 75000, previousPrice: 75000, pricePerKg: 1500, trend: 'igual', variationPct: 0 },
  { product: 'Yuca', presentation: 'Bulto 62.5 kg', currentPrice: 75000, previousPrice: 75000, pricePerKg: 1200, trend: 'igual', variationPct: 0 },

  // Granos y cereales
  { product: 'Arroz excelso', presentation: 'Arroba', currentPrice: 47750, previousPrice: 47750, pricePerKg: 3820, trend: 'igual', variationPct: 0 },
  { product: 'Arveja seca', presentation: 'Kg 1.000 gr.', currentPrice: 3300, previousPrice: 3300, pricePerKg: 3300, trend: 'igual', variationPct: 0 },
  { product: 'Lenteja Importada', presentation: 'Bulto 50 kg', currentPrice: 228000, previousPrice: 228000, pricePerKg: 4560, trend: 'igual', variationPct: 0 },
  { product: 'Maíz Amarillo Importado', presentation: 'Bulto 50 kg', currentPrice: 103500, previousPrice: 103500, pricePerKg: 2070, trend: 'igual', variationPct: 0 },
  { product: 'Harina de trigo', presentation: 'Bulto 50 kg', currentPrice: 123000, previousPrice: 123000, pricePerKg: 2460, trend: 'igual', variationPct: 0 },

  // Lácteos y huevos
  { product: 'Huevo rojo A', presentation: 'Bandeja 30 unidades', currentPrice: 12000, previousPrice: 12000, pricePerKg: 12000, trend: 'igual', variationPct: 0 },
  { product: 'Huevo rojo AA', presentation: 'Bandeja 30 unidades', currentPrice: 14000, previousPrice: 14000, pricePerKg: 14000, trend: 'igual', variationPct: 0 },

  // Carnes y pescados
  { product: 'Carne de res', presentation: 'Libra 500 gr.', currentPrice: 20000, previousPrice: 20000, pricePerKg: 40000, trend: 'igual', variationPct: 0 },
  { product: 'Pechuga de pollo', presentation: 'Kilogramo', currentPrice: 19000, previousPrice: 19000, pricePerKg: 19000, trend: 'igual', variationPct: 0 },
  { product: 'Bagre Criollo', presentation: 'Arroba 12,5 kg', currentPrice: 350000, previousPrice: 350000, pricePerKg: 28000, trend: 'igual', variationPct: 0 },
  { product: 'Bocachico criollo', presentation: 'Arroba 12,5 kg', currentPrice: 350000, previousPrice: 350000, pricePerKg: 28000, trend: 'igual', variationPct: 0 },
  { product: 'Cachama', presentation: 'Arroba 12,5 kg', currentPrice: 110000, previousPrice: 110000, pricePerKg: 8800, trend: 'igual', variationPct: 0 },
  { product: 'Mojarra', presentation: 'Arroba 12,5 kg', currentPrice: 150000, previousPrice: 145000, pricePerKg: 12000, trend: 'subio', variationPct: 3.4 },

  // Procesados
  { product: 'Aceite Vegetal', presentation: 'Litro', currentPrice: 6500, previousPrice: 6500, pricePerKg: 6500, trend: 'igual', variationPct: 0 },
  { product: 'Azúcar Refinada', presentation: 'Bulto 50 kg', currentPrice: 160000, previousPrice: 160000, pricePerKg: 3200, trend: 'igual', variationPct: 0 },
  { product: 'Café', presentation: 'Libra 500 gr.', currentPrice: 23800, previousPrice: 23800, pricePerKg: 47600, trend: 'igual', variationPct: 0 },
  { product: 'Chocolate', presentation: 'Libra 500 gr.', currentPrice: 13250, previousPrice: 13250, pricePerKg: 26500, trend: 'igual', variationPct: 0 },
  { product: 'Panela Cuadrada blanca', presentation: 'Caja 32 unidades', currentPrice: 83000, previousPrice: 83000, pricePerKg: 83000, trend: 'igual', variationPct: 0 },
  { product: 'Sal yodada', presentation: 'Arroba', currentPrice: 33800, previousPrice: 33800, pricePerKg: 2704, trend: 'igual', variationPct: 0 },
]

const seed = async () => {
  await connectDB();

  let created = 0;
  for (const p of products) {
    await MarketPrice.findOneAndUpdate(
      { product: p.product, presentation: p.presentation },
      {
        ...p,
        category: categorize(p.product),
        source: 'Centroabastos Bucaramanga',
        lastUpdated: new Date('2026-06-30'),
      },
      { upsert: true, new: true }
    );
    created++;
  }

  console.log(`✅ ${created} precios de mercado cargados (Centroabastos Bucaramanga, 30/06/2026)`);
  mongoose.connection.close();
};

seed();
