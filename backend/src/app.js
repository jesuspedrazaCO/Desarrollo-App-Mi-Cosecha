import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas locales (Es obligatorio que terminen en .js)
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import householdRoutes from './routes/householdRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import marketPriceRoutes from './routes/marketPriceRoutes.js';
import plantingPlotRoutes from './routes/plantingPlotRoutes.js'
import agroRoutes from './routes/agroRoutes.js'


// Middlewares locales (También con .js)
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

// Configuración para simular __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Servidor funcionando correctamente' }));

app.use('/api/agro', agroRoutes) 
app.use('/api/planting-plots', plantingPlotRoutes)
app.use(notFound);
app.use(errorHandler);

// Exportación moderna en lugar de module.exports
export default app;