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
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  };
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}
