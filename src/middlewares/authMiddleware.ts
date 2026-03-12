import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtPayload } from "../types/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// Permission map for different admin roles
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

/**
 * Get permissions based on admin role type
 */
const getPermissionsByRole = (adminRole: string | undefined): string[] => {
  if (!adminRole) return [];
  return permissionMap[adminRole] || [];
};

/**
 * Authentication middleware
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  try {
    // Verify token
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

/**
 * Role-based access control middleware
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }
    next();
  };
};

/**
 * Permission-based middleware for granular admin access control
 */
export const hasPermission = (requiredPermissions: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    const { role, adminRole } = req.user || {};

    // Super admin has all permissions
    if (role === "ADMIN" && adminRole === "SUPER_ADMIN") {
      next();
      return;
    }

    // For non-super admins, check specific permissions
    if (role !== "ADMIN") {
      res
        .status(403)
        .json({ success: false, message: "Admin access required" });
      return;
    }

    const permissions = getPermissionsByRole(adminRole);
    const hasAccess = requiredPermissions.some((p) => permissions.includes(p));

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
