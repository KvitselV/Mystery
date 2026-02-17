import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
export declare function initializeWebSocket(httpServer: HTTPServer): SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare function broadcastLiveStateUpdate(io: SocketServer, tournamentId: string, liveState: unknown): void;
export declare function broadcastLevelChange(io: SocketServer, tournamentId: string, levelData: unknown): void;
/** Рассылка таймера каждую секунду — клиенты только отображают, сервер источник истины */
export declare function broadcastTimerTick(io: SocketServer, tournamentId: string, data: {
    levelRemainingTimeSeconds: number;
    currentLevelNumber: number;
    isPaused: boolean;
}): void;
export declare function broadcastPlayerEliminated(io: SocketServer, tournamentId: string, playerData: unknown): void;
export declare function broadcastTableUpdate(io: SocketServer, tableId: string, tableData: unknown): void;
export declare function broadcastSeatingChange(io: SocketServer, tournamentId: string, seatingData: unknown): void;
//# sourceMappingURL=websocket.d.ts.map