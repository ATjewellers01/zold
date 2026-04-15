import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtPayload, ResetPasswordJwtPayload } from "../types/index.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

const permissionMap: Record<string, string[]> = {
  OPERATIONS_ADMIN: [
    "manage_orders",
    "manage_delivery",
    "manage_conversions",
    "view_partners",
    "assign_partners",
  ],
  FINANCE_ADMIN: [
    "view_transactions",
    "manage_settlements",
    "view_reports",
    "export_data",
    "manage_rates",
  ],
  LOAN_ADMIN: [
    "approve_loans",
    "manage_pledges",
    "manage_emi",
    "view_loans",
    "process_repayment",
  ],
  SUPPORT_ADMIN: [
    "view_tickets",
    "respond_tickets",
    "view_users",
    "verify_kyc",
    "manage_complaints",
  ],
};

const getPermissionsByRole = (adminRole: string | undefined): string[] => {
  if (!adminRole) return [];
  return permissionMap[adminRole] || [];
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Prefer httpOnly cookie; fall back to Authorization header for clients
  // that still send Bearer tokens (e.g. direct fetch calls, Postman).
  const token: string | undefined =
    req.cookies?.token ?? req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      adminRole: decoded.adminRole,
      username: decoded.username,
    };
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
    return;
  }
};

export const resetPasswordMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if(!token) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  try {
    const decipher = jwt.verify(token, JWT_SECRET) as ResetPasswordJwtPayload;
    req.user = {
      otp: decipher.otp,
      email: decipher.email
    };
    next();
  }
  catch(error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token" 
    });
    return;
  }
}

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }
    next();
  };
};

export const hasPermission = (requiredPermissions: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const { role, adminRole } = req.user || {};

    if (role === "ADMIN" && adminRole === "SUPER_ADMIN") {
      next();
      return;
    }

    if (role !== "ADMIN") {
      res
        .status(403)
        .json({ success: false, message: "Admin access required" });
      return;
    }

    const permissions = getPermissionsByRole(adminRole);
    const hasAccess = requiredPermissions.every((p) => permissions.includes(p));

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions for this operation",
      });
      return;
    }

    next();
  };
};
