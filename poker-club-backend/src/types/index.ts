export interface JwtPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    clubCardNumber: string;
    phone: string;
    role: string;
    managedClubId?: string | null;
  };
}

export interface RegisterDto {
  name: string;
  clubCardNumber: string;
  phone: string;
  password: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}
