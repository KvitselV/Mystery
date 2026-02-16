import { api } from './client';

export type UserRole = 'ADMIN' | 'CONTROLLER' | 'PLAYER' | 'WAITER' | 'TV';

export interface User {
  id: string;
  name: string;
  clubCardNumber: string;
  phone: string;
  role: UserRole;
  managedClubId?: string | null;
  managedClub?: { id: string; name: string } | null;
  createdAt?: string;
}

export const authApi = {
  login: (phone: string, password: string) =>
    api.post<{ user: User }>('/auth/login', { phone, password }),
  register: (data: { name: string; clubCardNumber: string; phone: string; password: string }) =>
    api.post<{ user: User }>('/auth/register', data),
  logout: () => api.post<{ ok: boolean }>('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
  promoteToAdmin: () =>
    api.post<{ user: User }>('/auth/promote-me'),
  getUsers: () => api.get<{ users: User[] }>('/auth/users'),
  assignControllerToClub: (userId: string, clubId: string) =>
    api.post<{ managedClubId: string }>('/auth/assign-controller', { userId, clubId }),
  promoteToController: (userId: string, clubId: string) =>
    api.post<{ user: User }>('/auth/promote-controller', { userId, clubId }),
};
