"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = initializeWebSocket;
exports.broadcastLiveStateUpdate = broadcastLiveStateUpdate;
exports.broadcastLevelChange = broadcastLevelChange;
exports.broadcastTimerTick = broadcastTimerTick;
exports.broadcastPlayerEliminated = broadcastPlayerEliminated;
exports.broadcastTableUpdate = broadcastTableUpdate;
exports.broadcastSeatingChange = broadcastSeatingChange;
const cookie_1 = require("cookie");
const cookieSignature = __importStar(require("cookie-signature"));
const socket_io_1 = require("socket.io");
const session_1 = require("./config/session");
const COOKIE_NAME = 'poker.sid';
function initializeWebSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
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
        const parsed = (0, cookie_1.parse)(cookieHeader);
        const raw = parsed[COOKIE_NAME];
        if (!raw) {
            return next(new Error('Authentication error: No session cookie'));
        }
        const sessionId = cookieSignature.unsign(raw, session_1.sessionSecret);
        if (!sessionId) {
            return next(new Error('Authentication error: Invalid session'));
        }
        session_1.sessionStore.get(sessionId, (err, session) => {
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
/** Рассылка таймера каждую секунду — клиенты только отображают, сервер источник истины */
function broadcastTimerTick(io, tournamentId, data) {
    io.to(`tournament:${tournamentId}`).emit('timer_tick', data);
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