import express from 'express';
import { createServer } from 'http';
import { sessionMiddleware } from './config/session';
import authRoutes from './routes/authRoutes';
import financialRoutes from './routes/financialRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import blindStructureRoutes from './routes/blindStructureRoutes';
import { initializeWebSocket } from './websocket';
import leaderboardRoutes from './routes/leaderboardRoutes';
import mmrRoutes from './routes/mmrRoutes';
import achievementRoutes from './routes/achievements';
import statisticsRoutes from './routes/statistics';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import clubRoutes from './routes/clubRoutes';
import tournamentSeriesRoutes from './routes/tournamentSeriesRoutes';
import rewardRoutes from './routes/rewardRoutes';
import billRoutes from './routes/billRoutes';

const app = express();
const httpServer = createServer(app);

// Инициализируй WebSocket
export const io = initializeWebSocket(httpServer);

// CORS — обязательно первым, до express.json()
const allowed = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

const corsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin as string | undefined;
  const allowOrigin = origin && (allowed.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
    ? origin
    : allowed[0];
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
};

app.use(corsMiddleware);
app.use(express.json());
app.use(sessionMiddleware);

// Routes
app.use('/auth', authRoutes);
app.use('/user', financialRoutes);
app.use('/tournaments', tournamentRoutes);
app.use('/tournament-series', tournamentSeriesRoutes);
app.use('/blind-structures', blindStructureRoutes);
app.use('/leaderboards', leaderboardRoutes);  // ← Добавь
app.use('/mmr', mmrRoutes);  
app.use('/achievements', achievementRoutes);  // НОВОЕ
app.use('/statistics', statisticsRoutes);  
app.use('/menu', menuRoutes);
app.use('/orders', orderRoutes);
app.use('/clubs', clubRoutes);
app.use('/rewards', rewardRoutes);
app.use('/bills', billRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 — неизвестный маршрут
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Глобальный обработчик ошибок (для next(err))
app.use((
  err: Error & { statusCode?: number },
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV !== 'production';
  if (statusCode >= 500) {
    console.error('Server error:', err.message, isDev ? err.stack : '');
  }
  res.status(statusCode).json({
    error: statusCode >= 500 && !isDev ? 'Internal server error' : err.message,
  });
});

export { httpServer };