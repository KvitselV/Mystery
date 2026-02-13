import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
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
import rewardRoutes from './routes/rewardRoutes';
import billRoutes from './routes/billRoutes';

const app = express();
const httpServer = createServer(app);

// Инициализируй WebSocket
export const io = initializeWebSocket(httpServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());



// Routes
app.use('/auth', authRoutes);
app.use('/user', financialRoutes);
app.use('/tournaments', tournamentRoutes);
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