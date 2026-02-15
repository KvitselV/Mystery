import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TournamentService } from '../services/TournamentService';
import { AppDataSource } from '../config/database';
import { PlayerProfile } from '../models/PlayerProfile';

const tournamentService = new TournamentService();
const playerProfileRepository = AppDataSource.getRepository(PlayerProfile);

export class TournamentController {

  static async createTournament(req: AuthRequest, res: Response) {
    try {
      const clubId = req.user?.role === 'CONTROLLER' ? req.user.managedClubId : req.body.clubId;
      const { name, seriesId, startTime, buyInCost, startingStack, addonChips, rebuyChips, blindStructureId, rewards } = req.body;

      if (!name || !startTime || !buyInCost || !startingStack) {
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
        rebuyChips: rebuyChips ?? 0,
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
        paymentMethod || 'DEPOSIT'
        );

        res.status(201).json(registration);
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

        const players = await tournamentService.getTournamentPlayers(tournamentId);

        res.json({
        players: players.map((p) => ({
            id: p.id,
            playerId: p.player?.id,
            playerName: `${p.player.user.firstName} ${p.player.user.lastName}`,
            registeredAt: p.registeredAt,
            paymentMethod: p.paymentMethod,
            isActive: p.isActive,
        })),
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
        rebuyChips: body.rebuyChips,
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
      await tournamentService.deleteTournament(id, managedClubId);
      res.json({ message: 'Tournament deleted' });
    } catch (e: unknown) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'Failed' });
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
