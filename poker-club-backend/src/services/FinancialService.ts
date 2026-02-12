import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';
import { PlayerBalance } from '../models/PlayerBalance';
import { PlayerOperation } from '../models/PlayerOperation';
import { Tournament } from '../models/Tournament';


export class FinancialService {
  private playerProfileRepository = AppDataSource.getRepository(PlayerProfile);
  private playerBalanceRepository = AppDataSource.getRepository(PlayerBalance);
  private playerOperationRepository = AppDataSource.getRepository(PlayerOperation);
  private tournamentRepository = AppDataSource.getRepository(Tournament);



  async topupDeposit(playerId: string, amount: number): Promise<PlayerBalance> {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }


    const player = await this.playerProfileRepository.findOne({
      where: { id: playerId },
      relations: ['balance'],
    });


    if (!player) {
      throw new Error('Player not found');
    }


    if (!player.balance) {
      player.balance = this.playerBalanceRepository.create({
        playerProfile: player,  // ✅ ИЗМЕНЕНО
        depositBalance: 0,
        totalDeposited: 0,
      
      });
    }


    // Добавь депозит
    player.balance.depositBalance += amount;
    player.balance.totalDeposited += amount;
    player.balance.updatedAt = new Date();


    const updatedBalance = await this.playerBalanceRepository.save(player.balance);


    // Запиши операцию
    const operation = this.playerOperationRepository.create({
      playerProfile: player,  // ✅ УЖЕ ПРАВИЛЬНО
      operationType: 'DEPOSIT_TOPUP',
      amount,
      // tournament: undefined убрано, так как необязательно
    });
    await this.playerOperationRepository.save(operation);


    return updatedBalance;
  }



  async getBalance(playerId: string): Promise<PlayerBalance> {
    const player = await this.playerProfileRepository.findOne({
      where: { id: playerId },
      relations: ['balance'],
    });


    if (!player) {
      throw new Error('Player not found');
    }


    if (!player.balance) {
      const newBalance = this.playerBalanceRepository.create({
        playerProfile: player,  
        depositBalance: 0,
        totalDeposited: 0,
      
      });
      return await this.playerBalanceRepository.save(newBalance);
    }


    return player.balance;
  }


 
  async deductBalance(
    playerId: string,
    amount: number,
    operationType: 'BUYIN' | 'REBUY' | 'ADDON',
    tournamentId: string
  ): Promise<PlayerBalance> {
    const player = await this.playerProfileRepository.findOne({
      where: { id: playerId },
      relations: ['balance'],
    });


    if (!player || !player.balance) {
      throw new Error('Player or balance not found');
    }


    if (player.balance.depositBalance < amount) {
      throw new Error('Insufficient balance');
    }


    player.balance.depositBalance -= amount;
    player.balance.updatedAt = new Date();


    const updatedBalance = await this.playerBalanceRepository.save(player.balance);


    // Запиши операцию
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });


    const operation = this.playerOperationRepository.create({
      playerProfile: player,  // ✅ ИЗМЕНЕНО
      operationType,
      amount,
      tournament: tournament || undefined,  // ✅ ИЗМЕНЕНО
    });
    await this.playerOperationRepository.save(operation);


    return updatedBalance;
  }



  async addBalance(
    playerId: string,
    amount: number,
    operationType: 'PRIZE' | 'REFUND',
    tournamentId?: string
  ): Promise<PlayerBalance> {
    const player = await this.playerProfileRepository.findOne({
      where: { id: playerId },
      relations: ['balance'],
    });


    if (!player) {
      throw new Error('Player not found');
    }


    if (!player.balance) {
      player.balance = this.playerBalanceRepository.create({
        playerProfile: player,  // ✅ ИЗМЕНЕНО
        depositBalance: 0,
        totalDeposited: 0,
        
      });
    }


    player.balance.depositBalance += amount;
    player.balance.updatedAt = new Date();


    const updatedBalance = await this.playerBalanceRepository.save(player.balance);


    // Запиши операцию
    const tournament = tournamentId
      ? await this.tournamentRepository.findOne({ where: { id: tournamentId } })
      : undefined;  // ✅ ИЗМЕНЕНО


    const operation = this.playerOperationRepository.create({
      playerProfile: player,  // ✅ ИЗМЕНЕНО
      operationType,
      amount,
      ...(tournament && { tournament }),
    });
    await this.playerOperationRepository.save(operation);


    return updatedBalance;
  }


 
  async getOperationHistory(
    playerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ operations: PlayerOperation[]; total: number }> {
    const [operations, total] = await this.playerOperationRepository.findAndCount({
      where: { playerProfile: { id: playerId } },  // ✅ ИЗМЕНЕНО
      relations: ['tournament'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });


    return { operations, total };
  }

  
}
