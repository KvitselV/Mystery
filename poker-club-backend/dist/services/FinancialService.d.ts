import { PlayerBalance } from '../models/PlayerBalance';
import { PlayerOperation } from '../models/PlayerOperation';
export declare class FinancialService {
    private playerProfileRepository;
    private playerBalanceRepository;
    private playerOperationRepository;
    private tournamentRepository;
    topupDeposit(playerId: string, amount: number): Promise<PlayerBalance>;
    getBalance(playerId: string): Promise<PlayerBalance>;
    /**
     * Списание с депозита за участие в турнире: бай-ин (регистрация), ребай, аддон.
     * При оплате CASH списание не выполняется (оплата на месте).
     */
    deductBalance(playerId: string, amount: number, operationType: 'BUYIN' | 'REBUY' | 'ADDON', tournamentId: string): Promise<PlayerBalance>;
    /**
     * Зачисление на депозит: только REFUND (возврат при отмене регистрации на турнир).
     * Денежных призов за победу/места нет — призы назначает админ (немонетарные Reward).
     */
    addBalance(playerId: string, amount: number, operationType: 'REFUND', tournamentId?: string): Promise<PlayerBalance>;
    getOperationHistory(playerId: string, limit?: number, offset?: number): Promise<{
        operations: PlayerOperation[];
        total: number;
    }>;
}
//# sourceMappingURL=FinancialService.d.ts.map