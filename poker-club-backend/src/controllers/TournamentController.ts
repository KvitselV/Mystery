import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TournamentService } from '../services/TournamentService';
import { AuthService } from '../services/AuthService';
import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';
import { User } from '../models/User';

const tournamentService = new TournamentService();
const authService = new AuthService();
const playerProfileRepository = AppDataSource.getRepository(PlayerProfile);
const userRepository = AppDataSource.getRepository(User);

export class TournamentController {

  static async createTournament(req: AuthRequest, res: Response) {
    try {
      const clubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : req.body.clubId;
      const { name, seriesId, startTime, buyInCost, startingStack, addonChips, addonCost, rebuyChips, rebuyCost, maxRebuys, maxAddons, blindStructureId, rewards } = req.body;

      if (!name || !startTime || (buyInCost === undefined || buyInCost === null || buyInCost < 0) || !startingStack) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const tournament = await tournamentService.createTournament({
        name,
        seriesId,
        clubId: req.user?.role === 'CONTROLLER' ? req.user.managedClubId ?? undefined : req.body.clubId,
        startTime: new Date(startTime),
        buyInCost,
        startingStack,
        addonChips: addonChips ?? 0,
        addonCost: addonCost ?? 0,
        rebuyChips: rebuyChips ?? 0,
        rebuyCost: rebuyCost ?? 0,
        maxRebuys: maxRebuys ?? 0,
        maxAddons: maxAddons ?? 0,
        blindStructureId,
        rewards: Array.isArray(rewards) ? rewards : undefined,
      });

      res.status(201).json(tournament);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * GET /tournaments - Получить список турниров
   */
  static async getTournaments(req: AuthRequest, res: Response) {
    try {
      const statusRaw = req.query.status;
      const seriesIdRaw = req.query.seriesId;
      const clubIdRaw = req.query.clubId;
      const limitRaw = req.query.limit;
      const offsetRaw = req.query.offset;

      const status = typeof statusRaw === 'string' ? statusRaw : undefined;
      const seriesId = typeof seriesIdRaw === 'string' ? seriesIdRaw : undefined;
      const clubId = typeof clubIdRaw === 'string' ? clubIdRaw : undefined;
      const limit = typeof limitRaw === 'string' ? parseInt(limitRaw) : 50;
      const offset = typeof offsetRaw === 'string' ? parseInt(offsetRaw) : 0;

      const { tournaments, total } = await tournamentService.getTournaments({
        status,
        seriesId,
        clubId,
        limit,
        offset,
      });

      res.json({ tournaments, total });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

    /**
     * GET /tournaments/:id - Получить турнир по ID
     */
    static async getTournamentById(req: AuthRequest, res: Response) {
    try {
        const tournamentIdRaw = req.params.id;
        const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;

        const tournament = await tournamentService.getTournamentById(tournamentId);

        res.json(tournament);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Not found';
        res.status(404).json({ error: message });
    }
    }

  static async updateTournamentRewards(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      await tournamentService.ensureTournamentBelongsToClub(id, managedClubId);
      const { rewards } = req.body;
      if (!Array.isArray(rewards)) {
        return res.status(400).json({ error: 'rewards must be an array of { rewardId, place }' });
      }
      await tournamentService.setTournamentRewards(id, rewards);
      const tournament = await tournamentService.getTournamentById(id);
      res.json(tournament);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

    /**
     * POST /tournaments/:id/register - Зарегистрироваться на турнир
     */
    static async registerForTournament(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
        }

        const tournamentIdRaw = req.params.id;
        const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
        const { paymentMethod } = req.body;

        // Получи PlayerProfile по userId
        const playerProfile = await playerProfileRepository.findOne({
        where: { user: { id: req.user.userId } },
        });

        if (!playerProfile) {
        return res.status(404).json({ error: 'Player profile not found' });
        }

        const registration = await tournamentService.registerPlayer(
        tournamentId,
        playerProfile.id,
        paymentMethod || 'DEPOSIT',
        false // саморег — игрок ещё не прибыл
        );

        res.status(201).json(registration);
    } catch (error: unknown) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
    }

    /**
     * POST /tournaments/:id/register-guest - Зарегистрировать гостя (админ создаёт аккаунт и записывает на турнир)
     */
    static async registerGuest(req: AuthRequest, res: Response) {
      try {
        const tournamentId = (req.params.id as string) || '';
        const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
        await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

        const { name, clubCardNumber, phone, password } = req.body;
        if (!name || !clubCardNumber || !phone || !password) {
          return res.status(400).json({ error: 'Обязательные поля: имя, номер клубной карты, телефон, пароль' });
        }

        const { playerProfileId } = await authService.createUserAsGuest({
          name,
          clubCardNumber,
          phone,
          password,
        });

        const registration = await tournamentService.registerPlayer(
          tournamentId,
          playerProfileId,
          'CASH',
          true
        );

        res.status(201).json({
          message: 'Гость зарегистрирован и записан на турнир',
          registration: {
            id: registration.id,
            playerId: registration.player?.id,
            playerName: name,
            clubCardNumber,
            isArrived: registration.isArrived,
          },
        });
      } catch (error: unknown) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
      }
    }

    /**
     * POST /tournaments/:id/register-by-card - Записать на турнир по номеру клубной карты
     */
    static async registerByCard(req: AuthRequest, res: Response) {
      try {
        const tournamentId = (req.params.id as string) || '';
        const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
        await tournamentService.ensureTournamentBelongsToClub(tournamentId, managedClubId);

        const { clubCardNumber } = req.body;
        if (!clubCardNumber || typeof clubCardNumber !== 'string') {
          return res.status(400).json({ error: 'Номер клубной карты обязателен' });
        }

        const user = await userRepository.findOne({
          where: { clubCardNumber: clubCardNumber.trim() },
        });
        if (!user) {
          return res.status(404).json({ error: 'Игрок с таким номером карты не найден' });
        }

        const playerProfile = await playerProfileRepository.findOne({
          where: { user: { id: user.id } },
        });
        if (!playerProfile) {
          return res.status(404).json({ error: 'Профиль игрока не найден' });
        }

        const registration = await tournamentService.registerPlayer(
          tournamentId,
          playerProfile.id,
          'CASH',
          true
        );

        res.status(201).json({
          message: 'Игрок записан на турнир',
          registration: {
            id: registration.id,
            playerId: registration.player?.id,
            playerName: user.name,
            clubCardNumber: user.clubCardNumber,
            isArrived: registration.isArrived,
          },
        });
      } catch (error: unknown) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
      }
    }

    /**
     * GET /tournaments/:id/players - Получить участников турнира
     */
    static async getTournamentPlayers(req: AuthRequest, res: Response) {
    try {
        const tournamentIdRaw = req.params.id;
        const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;

        const [players, eliminatedPlayerIds] = await Promise.all([
          tournamentService.getTournamentPlayers(tournamentId),
          tournamentService.getEliminatedPlayerIds(tournamentId),
        ]);

        res.json({
        players: players.map((p) => {
            const playerId = p.player?.id;
            const isEliminated = playerId ? eliminatedPlayerIds.has(playerId) : false;
            return {
              id: p.id,
              playerId,
              playerName: p.player?.user?.name,
              clubCardNumber: p.player?.user?.clubCardNumber,
              registeredAt: p.registeredAt,
              paymentMethod: p.paymentMethod,
              isActive: isEliminated ? false : p.isActive,
              isArrived: p.isArrived ?? true,
            };
        }),
        });
    } catch (error: unknown) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
    }

    /**
     * PATCH /tournaments/:id/status - Изменить статус турнира (только админ)
     */
    static async updateTournamentStatus(req: AuthRequest, res: Response) {
    try {
        const tournamentIdRaw = req.params.id;
        const tournamentId = Array.isArray(tournamentIdRaw) ? tournamentIdRaw[0] : tournamentIdRaw;
        const { status } = req.body;
        const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;

        if (!status) {
        return res.status(400).json({ error: 'Status is required' });
        }

        const tournament = await tournamentService.updateTournamentStatus(tournamentId, status, managedClubId);

        res.json(tournament);
    } catch (error: unknown) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
        }
    }
  static async updateTournament(req: AuthRequest, res: Response) {
    try {
      const id = (req.params.id as string) || '';
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      const body = req.body;
      const tournament = await tournamentService.updateTournament(id, {
        name: body.name,
        seriesId: body.seriesId,
        clubId: body.clubId,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        buyInCost: body.buyInCost,
        startingStack: body.startingStack,
        addonChips: body.addonChips,
        addonCost: body.addonCost,
        rebuyChips: body.rebuyChips,
        rebuyCost: body.rebuyCost,
        maxRebuys: body.maxRebuys,
        maxAddons: body.maxAddons,
        blindStructureId: body.blindStructureId,
      }, managedClubId);
      res.json(tournament);
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }

  static async deleteTournament(req: AuthRequest, res: Response) {
    try {
      const id = (req.params.id as string) || '';
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      const force = req.user?.role === 'ADMIN';
      await tournamentService.deleteTournament(id, managedClubId, { force });
      res.json({ message: 'Tournament deleted' });
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
    }
  }

  /**
   * PATCH /tournaments/:id/registrations/:registrationId/arrived - Отметить игрока как прибывшего
   */
  static async markPlayerArrived(req: AuthRequest, res: Response) {
    try {
      const tournamentId = (req.params.id as string) || '';
      const registrationId = (req.params.registrationId as string) || '';
      const managedClubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : undefined;
      const reg = await tournamentService.markPlayerArrived(tournamentId, registrationId, managedClubId);
      res.json(reg);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }

  /**
   * DELETE /tournaments/:id/register - Отменить регистрацию
   */
  static async unregisterFromTournament(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tournamentId = req.params.id as string;

      await tournamentService.unregisterFromTournament(
        req.user.userId,
        tournamentId
      );

      res.json({
        message: 'Unregistered successfully',
      });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Operation failed' });
    }
  }
}
