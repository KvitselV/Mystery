import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import { connectRedis } from './config/redis';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app: Express = express();



AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
  });

connectRedis().then(() => {
  console.log('✅ Redis connected');
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));





// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Server works!' });
});


// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'poo', timestamp: new Date().toISOString() });
});

export default app;

