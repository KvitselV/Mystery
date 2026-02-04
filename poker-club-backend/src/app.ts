import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import authRoutes from './routes/authRoutes';
import financialRoutes from './routes/financialRoutes';
import tournamentRoutes from './routes/tournamentRoutes';
import blindStructureRoutes from './routes/blindStructureRoutes';
import { initializeWebSocket } from './websocket';

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

export { httpServer };