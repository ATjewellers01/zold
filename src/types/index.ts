import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    role?: string;
    adminRole?: string;
    username?: string;
    otp?: string;
    email?: string;
  };
  metalPurchaseSession?: any;
  coinPurchaseSession?: any;
}

export interface JwtPayload {
  userId: string;
  role: string;
  adminRole?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

export interface ResetPasswordJwtPayload {
  otp: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

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

export interface GoldRateData {
  buyRate: number;
  sellRate: number;
  source?: string;
  error?: string;
}

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

export interface WalletBalance {
  // raw grams in wallet (virtual metal)
  goldGrams: number;
  silverGrams: number;
  rupeeBalance: number;

  // coin holdings (physical coins, in grams)
  goldCoinGrams: number;
  silverCoinGrams: number;

  // valuation in rupees (grams × rate)
  goldValuation: number;       // wallet gold value in ₹
  silverValuation: number;     // wallet silver value in ₹
  goldCoinValuation: number;   // gold coins value in ₹
  silverCoinValuation: number; // silver coins value in ₹
  totalValuation: number;      // everything combined in ₹

  // current rates per gram
  currentGoldRate: number;
  currentSilverRate: number;
}

export interface WalletStats {
  totalBought: number;
  totalSold: number;
  avgBuyPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

export type ExpressMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export type ErrorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => void;

export type ControllerFunction = (
  req: AuthenticatedRequest,
  res: Response,
) => Promise<void>;
