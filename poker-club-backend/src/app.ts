import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import financialRoutes from './routes/financialRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import blindStructureRoutes from './routes/blindStructureRoutes';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database initialization

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OKfsd', timestamp: new Date().toISOString() });
});

app.get('/health1', (req: Request, res: Response) => {
  res.json({ status: 'OKfsd', timestamp: new Date().toISOString() });
});
// Routes
app.use('/auth', authRoutes);
app.use('/user', financialRoutes);
app.use('/tournaments', tournamentRoutes);
app.use('/blind-structures', blindStructureRoutes); 

// 404 handler для несуществующих маршрутов
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;