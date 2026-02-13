"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = initializeWebSocket;
exports.broadcastLiveStateUpdate = broadcastLiveStateUpdate;
exports.broadcastLevelChange = broadcastLevelChange;
exports.broadcastPlayerEliminated = broadcastPlayerEliminated;
exports.broadcastTableUpdate = broadcastTableUpdate;
exports.broadcastSeatingChange = broadcastSeatingChange;
const socket_io_1 = require("socket.io");
const JwtService_1 = require("./services/JwtService");
const jwtService = new JwtService_1.JwtService();
function initializeWebSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
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
        }
        catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.data.userId}`);
        // Присоединиться к комнате турнира
        socket.on('join_tournament', (tournamentId) => {
            socket.join(`tournament:${tournamentId}`);
            console.log(`🎰 User ${socket.data.userId} joined tournament: ${tournamentId}`);
            socket.emit('joined_tournament', {
                tournamentId,
                message: 'Successfully joined tournament room',
            });
        });
        // Покинуть комнату турнира
        socket.on('leave_tournament', (tournamentId) => {
            socket.leave(`tournament:${tournamentId}`);
            console.log(`👋 User ${socket.data.userId} left tournament: ${tournamentId}`);
        });
        // Присоединиться к комнате стола
        socket.on('join_table', (tableId) => {
            socket.join(`table:${tableId}`);
            console.log(`🃏 User ${socket.data.userId} joined table: ${tableId}`);
            socket.emit('joined_table', {
                tableId,
                message: 'Successfully joined table room',
            });
        });
        // Покинуть комнату стола
        socket.on('leave_table', (tableId) => {
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
function broadcastLiveStateUpdate(io, tournamentId, liveState) {
    io.to(`tournament:${tournamentId}`).emit('live_state_update', liveState);
}
function broadcastLevelChange(io, tournamentId, levelData) {
    io.to(`tournament:${tournamentId}`).emit('level_change', levelData);
}
function broadcastPlayerEliminated(io, tournamentId, playerData) {
    io.to(`tournament:${tournamentId}`).emit('player_eliminated', playerData);
}
function broadcastTableUpdate(io, tableId, tableData) {
    io.to(`table:${tableId}`).emit('table_update', tableData);
}
function broadcastSeatingChange(io, tournamentId, seatingData) {
    io.to(`tournament:${tournamentId}`).emit('seating_change', seatingData);
}
//# sourceMappingURL=websocket.js.map