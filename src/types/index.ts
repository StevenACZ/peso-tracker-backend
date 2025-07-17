import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WeightRecord {
  id: number;
  user_id: number;
  weight: number;
  date: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Goal {
  id: number;
  user_id: number;
  target_weight: number;
  current_weight: number;
  target_date: string;
  notes?: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  startDate?: string;
  endDate?: string;
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ErrorResponse {
  error: string;
  stack?: string;
}
