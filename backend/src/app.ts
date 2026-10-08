import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './modules/auth/auth.routes';
import reportesRoutes from './modules/reportes/reportes.routes';
import { zonasRoutes, tiposFugaRoutes, cuadrillasRoutes } from './modules/catalogos/catalogos.routes';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ estado: 'ok' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 }), authRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/tipos-fuga', tiposFugaRoutes);
app.use('/api/cuadrillas', cuadrillasRoutes);
app.use('/api/reportes', reportesRoutes);

app.use(errorHandler); 