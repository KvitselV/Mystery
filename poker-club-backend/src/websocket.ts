import { parse } from 'cookie';
import * as cookieSignature from 'cookie-signature';
import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { sessionStore, sessionSecret } from './config/session';

const COOKIE_NAME = 'poker.sid';

export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookie'));
    }

    const parsed = parse(cookieHeader);
    const raw = parsed[COOKIE_NAME];
    if (!raw) {
      return next(new Error('Authentication error: No session cookie'));
    }

    const sessionId = cookieSignature.unsign(raw, sessionSecret);
    if (!sessionId) {
      return next(new Error('Authentication error: Invalid session'));
    }

    sessionStore.get(sessionId, (err, session) => {
      if (err || !session?.userId) {
        return next(new Error('Authentication error: Invalid or expired session'));
      }
      socket.data.userId = session.userId;
      socket.data.role = session.role;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.data.userId}`);

    // Присоединиться к комнате турнира
    socket.on('join_tournament', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`🎰 User ${socket.data.userId} joined tournament: ${tournamentId}`);
      
      socket.emit('joined_tournament', {
        tournamentId,
        message: 'Successfully joined tournament room',
      });
    });

    // Покинуть комнату турнира
    socket.on('leave_tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
      console.log(`👋 User ${socket.data.userId} left tournament: ${tournamentId}`);
    });

    // Присоединиться к комнате стола
    socket.on('join_table', (tableId: string) => {
      socket.join(`table:${tableId}`);
      console.log(`🃏 User ${socket.data.userId} joined table: ${tableId}`);
      
      socket.emit('joined_table', {
        tableId,
        message: 'Successfully joined table room',
      });
    });

    // Покинуть комнату стола
    socket.on('leave_table', (tableId: string) => {
      socket.leave(`table:${tableId}`);
      console.log(`👋 User ${socket.data.userId} left table: ${tableId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}

// Функции для отправки обновлений (payload — типизированы на стороне вызывающего кода)
export function broadcastLiveStateUpdate(io: SocketServer, tournamentId: string, liveState: unknown): void {
  io.to(`tournament:${tournamentId}`).emit('live_state_update', liveState);
}

export function broadcastLevelChange(io: SocketServer, tournamentId: string, levelData: unknown): void {
  io.to(`tournament:${tournamentId}`).emit('level_change', levelData);
}

export function broadcastPlayerEliminated(io: SocketServer, tournamentId: string, playerData: unknown): void {
  io.to(`tournament:${tournamentId}`).emit('player_eliminated', playerData);
}

export function broadcastTableUpdate(io: SocketServer, tableId: string, tableData: unknown): void {
  io.to(`table:${tableId}`).emit('table_update', tableData);
}

export function broadcastSeatingChange(io: SocketServer, tournamentId: string, seatingData: unknown): void {
  io.to(`tournament:${tournamentId}`).emit('seating_change', seatingData);
}
