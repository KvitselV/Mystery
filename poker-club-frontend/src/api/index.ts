import { api } from './client';
import { authApi } from './auth';

export { api, authApi };

// Tournament Series
export const tournamentSeriesApi = {
  list: (params?: { clubId?: string }) =>
    api.get<{ series: TournamentSeries[] }>('/tournament-series', { params }),
  getById: (id: string) => api.get<TournamentSeries & { daysOfWeek?: number[] }>(`/tournament-series/${id}`),
  create: (data: {
    name: string;
    periodStart: string;
    periodEnd: string;
    daysOfWeek?: number[];
    clubId?: string; // обязателен для Admin, для Controller берётся из managedClubId
    defaultStartTime?: string;
    defaultBuyIn?: number;
    defaultStartingStack?: number;
    defaultBlindStructureId?: string;
  }) => api.post<TournamentSeries>('/tournament-series', data),
  update: (id: string, data: Partial<{ name: string; periodStart: string; periodEnd: string; daysOfWeek: number[] }>) =>
    api.patch(`/tournament-series/${id}`, data),
  delete: (id: string) => api.delete(`/tournament-series/${id}`),
};

// Tournaments
export const tournamentsApi = {
  list: (params?: { clubId?: string; status?: string; limit?: number; offset?: number }) =>
    api.get<{ tournaments: Tournament[]; total: number }>('/tournaments', { params }),
  getById: (id: string) => api.get<Tournament>(`/tournaments/${id}`),
  getPlayers: (id: string) => api.get<{ players: TournamentPlayer[] }>(`/tournaments/${id}/players`),
  register: (id: string, paymentMethod?: string) =>
    api.post(`/tournaments/${id}/register`, { paymentMethod: paymentMethod || 'DEPOSIT' }),
  unregister: (id: string) => api.delete(`/tournaments/${id}/register`),
  create: (data: CreateTournamentDto) => api.post<Tournament>('/tournaments', data),
  update: (id: string, data: UpdateTournamentDto) =>
    api.patch<Tournament>(`/tournaments/${id}`, data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/tournaments/${id}/status`, { status }),
};

// Clubs
export const clubsApi = {
  list: () => api.get<{ clubs: Club[]; total: number }>('/clubs'),
  getById: (id: string) => api.get<Club>(`/clubs/${id}`),
  getSchedules: (id: string, dayOfWeek?: number) =>
    api.get<{ schedules: ClubSchedule[] }>(`/clubs/${id}/schedules`, { params: { dayOfWeek } }),
  create: (data: CreateClubDto) => api.post<Club>('/clubs', data),
  update: (id: string, data: Partial<Club>) => api.patch(`/clubs/${id}`, data),
  delete: (id: string) => api.delete(`/clubs/${id}`),
  addSchedule: (clubId: string, data: { dayOfWeek: number; startTime: string; endTime: string; eventType?: string; description?: string }) =>
    api.post<ClubSchedule>(`/clubs/${clubId}/schedules`, data),
  updateSchedule: (clubId: string, scheduleId: string, data: Partial<{ dayOfWeek: number; startTime: string; endTime: string; eventType: string; description: string; isActive: boolean }>) =>
    api.patch<ClubSchedule>(`/clubs/${clubId}/schedules/${scheduleId}`, data),
  deleteSchedule: (clubId: string, scheduleId: string) =>
    api.delete(`/clubs/${clubId}/schedules/${scheduleId}`),
};

// Seating / Tables
export const seatingApi = {
  getTables: (tournamentId: string) =>
    api.get<{ tables: TournamentTable[] }>(`/tournaments/${tournamentId}/tables`),
  getTableDetails: (tournamentId: string, tableId: string) =>
    api.get<{ table: TournamentTable }>(`/tournaments/${tournamentId}/tables/${tableId}`),
  initFromClub: (tournamentId: string) =>
    api.post(`/tournaments/${tournamentId}/tables/init-from-club`),
  autoSeating: (tournamentId: string) =>
    api.post(`/tournaments/${tournamentId}/seating/auto`),
  manualSeating: (tournamentId: string, body: { playerId: string; newTableId: string; newSeatNumber: number }) =>
    api.post(`/tournaments/${tournamentId}/seating/manual`, body),
};

// Live State
export const liveStateApi = {
  get: (tournamentId: string) =>
    api.get<{ liveState: LiveState }>(`/tournaments/${tournamentId}/live`),
  pause: (tournamentId: string) => api.patch(`/tournaments/${tournamentId}/pause`),
  resume: (tournamentId: string) => api.patch(`/tournaments/${tournamentId}/resume`),
  updateTime: (tournamentId: string, remainingSeconds: number) =>
    api.patch(`/tournaments/${tournamentId}/live/time`, { remainingSeconds }),
};

// Live Tournament (rebuy, addon, eliminate)
export const liveTournamentApi = {
  rebuy: (tournamentId: string, playerId: string, amount?: number) =>
    api.post(`/tournaments/${tournamentId}/player/${playerId}/rebuy`, { amount }),
  addon: (tournamentId: string, playerId: string, amount: number) =>
    api.post(`/tournaments/${tournamentId}/player/${playerId}/addon`, { amount }),
  eliminate: (tournamentId: string, playerId: string, finishPosition: number) =>
    api.post(`/tournaments/${tournamentId}/player/${playerId}/eliminate`, { finishPosition }),
  nextLevel: (tournamentId: string) => api.patch(`/tournaments/${tournamentId}/level/next`),
  getCurrentLevel: (tournamentId: string) =>
    api.get<{ level: TournamentLevel }>(`/tournaments/${tournamentId}/level/current`),
  finish: (tournamentId: string) => api.post(`/tournaments/${tournamentId}/finish`),
};

// Blind Structures
export const blindStructuresApi = {
  list: (params?: { clubId?: string }) =>
    api.get<{ structures: BlindStructure[] }>('/blind-structures', { params }),
  getById: (id: string) => api.get<{ structure: BlindStructure }>(`/blind-structures/${id}`),
  create: (data: { name: string; description?: string; levels: CreateLevelDto[]; clubId?: string | null }) =>
    api.post<{ structure: BlindStructure }>('/blind-structures', data),
  addLevel: (id: string, level: CreateLevelDto) =>
    api.post(`/blind-structures/${id}/levels`, level),
  deactivate: (id: string) => api.delete(`/blind-structures/${id}`),
};

// Leaderboards
export const leaderboardsApi = {
  list: () => api.get<{ leaderboards: Leaderboard[] }>('/leaderboards'),
  getEntries: (id: string, limit?: number, offset?: number) =>
    api.get<{ entries: LeaderboardEntry[] }>(`/leaderboards/${id}/entries`, { params: { limit, offset } }),
  getRankMmr: () => api.get<{ entries: LeaderboardEntry[] }>('/leaderboards/rank-mmr'),
  createSeasonal: () => api.post('/leaderboards/seasonal/create'),
  updateRankMmr: () => api.post('/leaderboards/rank-mmr/update'),
};

// MMR
export const mmrApi = {
  getTop: () => api.get('/mmr/top'),
  getByRank: (rankCode: string) => api.get(`/mmr/rank/${rankCode}`),
};

// Achievements
export const achievementsApi = {
  getTypes: () => api.get('/achievements/types'),
  getUser: (userId: string) => api.get(`/achievements/user/${userId}`),
  getUserProgress: (userId: string) => api.get(`/achievements/user/${userId}/progress`),
};

// Statistics
export const statisticsApi = {
  getFull: (userId: string) => api.get(`/statistics/user/${userId}`),
};

// Menu & Orders
export const menuApi = {
  getCategories: () => api.get<MenuCategory[]>('/menu/categories'),
  getCategoriesList: () => api.get<MenuCategory[]>('/menu/categories/list'),
  getItems: (categoryId?: string) =>
    api.get<MenuItem[]>('/menu/items', { params: categoryId ? { categoryId } : {} }),
  createCategory: (data: { name: string; description?: string; sortOrder?: number }) =>
    api.post<MenuCategory>('/menu/categories', data),
  updateCategory: (id: string, data: Partial<MenuCategory>) =>
    api.patch(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  createItem: (data: { name: string; price: number; categoryId: string; description?: string; sortOrder?: number }) =>
    api.post<MenuItem>('/menu/items', data),
  updateItem: (id: string, data: Partial<MenuItem>) =>
    api.patch(`/menu/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
};
export const ordersApi = {
  create: (data: CreateOrderDto) => api.post('/orders', data),
  getMy: () => api.get('/orders/my'),
  getTournament: (tournamentId: string) => api.get(`/orders/tournament/${tournamentId}`),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
};

// Types
export interface Tournament {
  id: string;
  name: string;
  startTime: string;
  status: 'REG_OPEN' | 'LATE_REG' | 'RUNNING' | 'FINISHED' | 'ARCHIVED';
  buyInCost: number;
  startingStack: number;
  addonChips?: number;
  rebuyChips?: number;
  currentLevelNumber?: number;
  blindStructureId?: string;
  clubId?: string;
  seriesId?: string;
  club?: Club;
  blindStructure?: BlindStructure & { levels?: TournamentLevel[] };
  registrations?: { id: string }[];
}
export interface TournamentPlayer {
  id: string;
  playerId?: string;
  playerName: string;
  registeredAt: string;
  paymentMethod: string;
  isActive: boolean;
}
export interface CreateTournamentDto {
  name: string;
  startTime: string;
  buyInCost: number;
  startingStack: number;
  seriesId?: string;
  clubId?: string;
  blindStructureId?: string;
  addonChips?: number;
  rebuyChips?: number;
}
export type UpdateTournamentDto = Omit<Partial<CreateTournamentDto>, 'seriesId' | 'clubId'> & {
  seriesId?: string | null;
  clubId?: string | null;
};
export interface Club {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  tableCount: number;
  isActive: boolean;
}
export interface CreateClubDto {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  tableCount: number;
}
export interface ClubSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  eventType?: string;
  description?: string;
}
export interface TournamentTable {
  id: string;
  tableNumber: number;
  status: string;
  occupiedSeats: number;
  maxSeats: number;
  seats: TableSeat[];
}
export interface TableSeat {
  id: string;
  seatNumber: number;
  isOccupied: boolean;
  status: string;
  playerName?: string;
  playerId?: string;
}
export interface LiveState {
  tournamentId: string;
  tournamentName: string;
  currentLevelNumber: number;
  levelRemainingTimeSeconds: number;
  playersCount: number;
  averageStack: number;
  isPaused: boolean;
  liveStatus?: string;
  entriesCount?: number;
}
export interface TournamentLevel {
  id: string;
  levelNumber: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  durationMinutes: number;
  isBreak?: boolean;
}
export interface BlindStructure {
  id: string;
  name: string;
  description?: string;
  levels?: TournamentLevel[];
}
export interface CreateLevelDto {
  levelNumber: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
  durationMinutes: number;
  isBreak?: boolean;
}
export interface Leaderboard {
  id: string;
  name: string;
  type: string;
  periodStart?: string;
  periodEnd?: string;
  seriesId?: string | null;
}
export interface LeaderboardEntry {
  id?: string;
  rankPosition: number;
  playerName?: string;
  points?: number;
  ratingPoints?: number;
  mmr?: number;
}
export interface TournamentSeries {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  daysOfWeek?: string;
}
export interface CreateOrderDto {
  tournamentId?: string;
  items: { menuItemId: string; quantity: number }[];
  paymentMethod?: string;
}
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  items?: MenuItem[];
}
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  sortOrder?: number;
  isAvailable?: boolean;
}
