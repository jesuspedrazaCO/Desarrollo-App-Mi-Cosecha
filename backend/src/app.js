import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas locales (Es obligatorio que terminen en .js)
import aiRoutes from "./routes/aiRoutes.js";
import agroRoutes from './routes/agroRoutes.js';
import plantingPlotRoutes from './routes/plantingPlotRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import householdRoutes from './routes/householdRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import marketPriceRoutes from './routes/marketPriceRoutes.js';
import contributorRoutes from './routes/contributorRoutes.js'
import assistantRoutes from './routes/assistantRoutes.js';


// Middlewares locales (También con .js)
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import { sanitizeInput } from './middlewares/sanitizeMiddleware.js';
import { verifyToken } from './config/jwt.js';

// Configuración para simular __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Render pone un proxy delante de la app. Sin esto todos los usuarios parecen tener la misma IP
// y los límites de intentos (login, etc.) se comparten entre todos.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite por usuario para las funciones de IA (cada mensaje gasta cuota de Gemini).
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  skip: (req) => req.method !== 'POST',
  keyGenerator: (req) => {
    try {
      const token = (req.headers.authorization || '').split(' ')[1];
      return `user:${verifyToken(token).id}`;
    } catch {
      return req.ip;
    }
  },
  message: { message: 'Has enviado muchos mensajes seguidos. Intenta de nuevo en un rato.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// FRONTEND_URL puede traer una o varias direcciones separadas por coma (p. ej. el dominio nuevo y el anterior).
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin) ? (origin || true) : false),
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(sanitizeInput);
// El token de recuperación de contraseña viaja en la URL: no se guarda en los logs.
morgan.token('safe-url', (req) => req.originalUrl.replace(/(reset-password\/)[^/?#]+/, '$1[oculto]'));
app.use(morgan(':method :safe-url :status :response-time ms'));
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use(['/api/ai', '/api/agro', '/api/assistant'], aiLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agro', agroRoutes);
app.use('/api/planting-plots', plantingPlotRoutes);
app.use('/api/contributors', contributorRoutes)
app.use('/api/assistant', assistantRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Servidor funcionando correctamente' }));

app.use(notFound);
app.use(errorHandler);

// Exportación moderna en lugar de module.exports
export default app;