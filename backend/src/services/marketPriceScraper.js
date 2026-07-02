const axios = require('axios');
const cheerio = require('cheerio');
const MarketPrice = require('../models/MarketPrice');

const BASE_URL = 'https://preciosnub.centroabastos.com/vistas/list_productos.php';
const TOTAL_PAGES = 18; // Total de páginas conocidas en el sitio

// Categorización simple por palabras clave en el nombre del producto
const categorize = (name) => {
  const n = name.toLowerCase();
  if (/aguacate|piña|mango|mandarina|naranja|limón|limon|pera|manzana|maracuyá|maracuya|guayaba|papaya|melón|melon|sandía|sandia|fresa|mora|lulo|guanábana|guanabana|tomate de árbol|banano|plátano|platano|uva|arándano|arandano|pitahaya|agras/.test(n)) return 'frutas';
  if (/papa|yuca|arracacha|apio|zanahoria|remolacha|rábano|rabano|ñame|name/.test(n)) return 'tuberculos';
  if (/cebolla|tomate|pimentón|pimenton|repollo|lechuga|coliflor|brócoli|brocoli|espinaca|acelga|pepino|ahuyama|habichuela|arveja|frijol|calabacín|calabacin|berenjena|perejil|cilantro/.test(n)) return 'verduras';
  if (/arroz|maíz|maiz|fríjol|frijol|lenteja|garbanzo|avena|trigo/.test(n)) return 'granos';
  if (/leche|queso|huevo|mantequilla|yogur/.test(n)) return 'lacteos';
  if (/aceite|panela|azúcar|azucar|sal|harina/.test(n)) return 'procesados';
  return 'otros';
};

const parseMoneyToNumber = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/[^\d]/g, '')) || 0;
};

const parsePercent = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
};

const trendFromText = (str) => {
  const t = (str || '').toLowerCase();
  if (t.includes('subi')) return 'subio';
  if (t.includes('baj')) return 'bajo';
  return 'igual';
};

// Scrapea una sola página y devuelve los productos encontrados
const scrapePage = async (pageNum) => {
  const url = `${BASE_URL}?pagina=${pageNum}`;
  const { data: html } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(html);

  const products = [];

  $('table tbody tr, table tr').each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 6) return; // saltar filas que no son de datos

    const product = $(cells[0]).text().trim();
    const presentation = $(cells[1]).text().trim();
    // cells[2] = precio anterior, cells[3] = precio actual, cells[4] = tendencia, cells[5] = variación, cells[6] = precio/kg
    const previousPrice = parseMoneyToNumber($(cells[2]).text());
    const currentPrice = parseMoneyToNumber($(cells[3]).text());
    const trend = trendFromText($(cells[4]).text());
    const variationPct = parsePercent($(cells[5]).text());
    const pricePerKg = cells.length > 6 ? parseMoneyToNumber($(cells[6]).text()) : currentPrice;

    if (product && currentPrice > 0) {
      products.push({
        product,
        presentation,
        currentPrice,
        previousPrice,
        pricePerKg,
        trend,
        variationPct,
        category: categorize(product),
      });
    }
  });

  return products;
};

// Scrapea todas las páginas y actualiza la base de datos
const scrapeAllAndSave = async () => {
  console.log('🔄 Iniciando actualización de precios de mercado (Centroabastos)...');
  let totalSaved = 0;
  let totalErrors = 0;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      const products = await scrapePage(page);

      for (const p of products) {
        await MarketPrice.findOneAndUpdate(
          { product: p.product, presentation: p.presentation },
          { ...p, source: 'Centroabastos Bucaramanga', lastUpdated: new Date() },
          { upsert: true, new: true }
        );
        totalSaved++;
      }

      // Pequeña pausa entre peticiones para no sobrecargar el sitio
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      totalErrors++;
      console.error(`⚠️  Error en página ${page}:`, error.message);
    }
  }

  console.log(`✅ Precios actualizados: ${totalSaved} productos guardados, ${totalErrors} errores de página.`);
  return { totalSaved, totalErrors };
};

module.exports = { scrapeAllAndSave, scrapePage };
