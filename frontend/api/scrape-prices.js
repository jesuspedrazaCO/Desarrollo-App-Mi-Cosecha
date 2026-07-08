// Vercel Serverless Function — /api/scrape-prices
// Corre en los servidores de Vercel (no Render), puede acceder a sitios externos

const https = require('https');

const fetchPage = (pageNum) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'preciosnub.centroabastos.com',
      path: `/vistas/list_productos.php?pagina=${pageNum}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9',
        'Referer': 'https://preciosnub.centroabastos.com/',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
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
  if (t.includes('subi') || t.includes('alza') || t.includes('up')) return 'subio';
  if (t.includes('baj') || t.includes('down')) return 'bajo';
  return 'igual';
};

const parseHtmlTable = (html) => {
  const products = [];
  // Extraer filas de tabla con regex simple (sin cheerio en serverless)
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const stripTags = (str) => str.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cells = [];
    let cellMatch;
    const cellRegexLocal = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((cellMatch = cellRegexLocal.exec(rowContent)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (cells.length >= 5) {
      const product = cells[0];
      const presentation = cells[1];
      const previousPrice = parseMoneyToNumber(cells[2]);
      const currentPrice = parseMoneyToNumber(cells[3]);
      const trend = trendFromText(cells[4]);
      const variationPct = cells.length > 5 ? parsePercent(cells[5]) : 0;
      const pricePerKg = cells.length > 6 ? parseMoneyToNumber(cells[6]) : currentPrice;

      if (product && product.length > 2 && currentPrice > 100) {
        products.push({ product, presentation, previousPrice, currentPrice, pricePerKg, trend, variationPct });
      }
    }
  }
  return products;
};

const categorize = (name) => {
  const n = (name || '').toLowerCase();
  if (/aguacate|piña|mango|mandarina|naranja|limón|limon|pera|manzana|maracuy|guayaba|papaya|melón|melon|patilla|sandía|sandia|fresa|mora|lulo|guanábana|guanabana|banano|plátano|platano|guineo|uva|kiwi|pitahaya/.test(n)) return 'frutas';
  if (/papa|yuca|arracacha|zanahoria|remolacha|ñame|name|mazorca/.test(n)) return 'tuberculos';
  if (/cebolla|tomate(?! de árbol)|pimentón|pimenton|repollo|lechuga|coliflor|brócoli|brocoli|espinaca|pepino|ahuyama|habichuela|arveja|frijol|cilantro|ajo/.test(n)) return 'verduras';
  if (/arroz|maíz|maiz|lenteja|garbanzo|avena|trigo|harina/.test(n)) return 'granos';
  if (/huevo|leche|queso|mantequilla/.test(n)) return 'lacteos';
  if (/carne|pollo|pechuga/.test(n)) return 'carnes';
  if (/bagre|bocachico|cachama|mojarra|dorada|salmón|salmon/.test(n)) return 'pescados';
  return 'otros';
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200'); // caché 1 hora en Vercel

  if (req.method === 'OPTIONS') return res.status(200).end();

  const page = parseInt(req.query.page || '1');
  const allPages = req.query.all === 'true';

  try {
    if (allPages) {
      // Scrapear todas las páginas (máx 18)
      const allProducts = [];
      for (let p = 1; p <= 18; p++) {
        try {
          const { status, html } = await fetchPage(p);
          if (status === 200) {
            const products = parseHtmlTable(html);
            allProducts.push(...products);
          }
          // Pausa entre peticiones
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error(`Error página ${p}:`, e.message);
        }
      }

      return res.status(200).json({
        success: true,
        total: allProducts.length,
        lastUpdated: new Date().toISOString(),
        products: allProducts.map(p => ({ ...p, category: categorize(p.product) })),
      });
    }

    // Una sola página
    const { status, html } = await fetchPage(page);
    if (status !== 200) {
      return res.status(502).json({ success: false, error: `Sitio respondió ${status}` });
    }

    const products = parseHtmlTable(html);
    return res.status(200).json({
      success: true,
      page,
      total: products.length,
      lastUpdated: new Date().toISOString(),
      products: products.map(p => ({ ...p, category: categorize(p.product) })),
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
