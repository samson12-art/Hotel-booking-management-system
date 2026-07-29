import { Request } from "express";

export type Role = "CUSTOMER" | "HOTEL_MANAGER" | "STAFF" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  query?: string;
  cityId?: string;
  countryId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  roomType?: string;
  amenities?: string[];
  checkIn?: string;
  checkOut?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}
