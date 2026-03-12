import { Request, Response, NextFunction } from "express";

// Extended Request with user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    adminRole?: string;
    username?: string;
  };
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  role: string;
  adminRole?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Gold Rate
export interface GoldRateData {
  buyRate: number;
  sellRate: number;
  source?: string;
  error?: string;
}

// Transaction types
export interface BuyGoldData {
  amountInRupees: number;
  goldGrams: number;
  storageType?: string;
  paymentMode?: string;
}

export interface SellGoldData {
  goldGrams: number;
  paymentMethod?: string;
  bankAccountId?: string;
  paymentMethodId?: string;
}

// Wallet types
export interface WalletBalance {
  goldBalance: number;
  rupeeBalance: number;
  currentValue: number;
  currentRate: number;
  recentTransactions: any[];
}

export interface WalletStats {
  totalBought: number;
  totalSold: number;
  avgBuyPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Express middleware type
export type ExpressMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

// Error middleware type
export type ErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

// Controller function type
export type ControllerFunction = (
  req: AuthenticatedRequest,
  res: Response,
) => Promise<void>;
