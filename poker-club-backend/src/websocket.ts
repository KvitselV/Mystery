import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { JwtService } from './services/JwtService';

const jwtService = new JwtService();

export function initializeWebSocket(httpServer: HTTPServer) {
  const io = new SocketServer(httpServer, {
    cors: {
       origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  });

  // Middleware для аутентификации
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const payload = jwtService.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
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

// Функции для отправки обновлений
export function broadcastLiveStateUpdate(io: SocketServer, tournamentId: string, liveState: any) {
  io.to(`tournament:${tournamentId}`).emit('live_state_update', liveState);
}

export function broadcastLevelChange(io: SocketServer, tournamentId: string, levelData: any) {
  io.to(`tournament:${tournamentId}`).emit('level_change', levelData);
}

export function broadcastPlayerEliminated(io: SocketServer, tournamentId: string, playerData: any) {
  io.to(`tournament:${tournamentId}`).emit('player_eliminated', playerData);
}

export function broadcastTableUpdate(io: SocketServer, tableId: string, tableData: any) {
  io.to(`table:${tableId}`).emit('table_update', tableData);
}

export function broadcastSeatingChange(io: SocketServer, tournamentId: string, seatingData: any) {
  io.to(`tournament:${tournamentId}`).emit('seating_change', seatingData);
}
