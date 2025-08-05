export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface TemporalPaginationMeta {
  currentPeriod: string;
  hasNext: boolean;
  hasPrevious: boolean;
  totalPeriods: number;
  currentPage: number;
}

export interface TemporalPaginatedResponse<T> {
  data: T[];
  pagination: TemporalPaginationMeta;
}

export interface DeleteResponse {
  message: string;
  deletedId?: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  responseTime?: string;
  message: string;
  error?: string;
  path?: string;
}

export interface StorageUrls {
  thumbnailUrl: string;
  mediumUrl: string;
  fullUrl: string;
}
