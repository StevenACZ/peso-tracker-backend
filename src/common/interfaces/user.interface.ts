export interface AuthenticatedUser {
  id: number;
  email?: string;
  username?: string;
}

export interface UserPayload {
  sub: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}
