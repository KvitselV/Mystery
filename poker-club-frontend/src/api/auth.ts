import { api } from './client';

export type UserRole = 'ADMIN' | 'CONTROLLER' | 'PLAYER' | 'WAITER' | 'TV';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: UserRole;
  managedClubId?: string | null;
  managedClub?: { id: string; name: string } | null;
  createdAt: string;
}

export const authApi = {
  login: (phone: string, password: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/login', { phone, password }),
  register: (data: { firstName: string; lastName: string; phone: string; password: string; email?: string }) =>
    api.post<{ accessToken: string; user: User }>('/auth/register', data),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  me: () => api.get<User>('/auth/me'),
  promoteToAdmin: () =>
    api.post<{ accessToken: string; user: User }>('/auth/promote-me'),
  getUsers: () => api.get<{ users: User[] }>('/auth/users'),
  assignControllerToClub: (userId: string, clubId: string) =>
    api.post<{ managedClubId: string }>('/auth/assign-controller', { userId, clubId }),
  promoteToController: (userId: string, clubId: string) =>
    api.post<{ accessToken: string; user: User }>('/auth/promote-controller', { userId, clubId }),
};
