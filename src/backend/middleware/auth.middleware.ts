import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "./error.middleware";

// Extend Express Request object to hold user details
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "patient" | "doctor" | "admin" | "superadmin";
      };
    }
  }
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "No authentication token provided"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: "patient" | "doctor" | "admin" | "superadmin";
    };
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Access token expired"));
    }
    return next(new ApiError(401, "Invalid access token"));
  }
}

export function requireRole(allowedRoles: ("patient" | "doctor" | "admin" | "superadmin")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { role } = req.user;

    // Super Admin inherits all admin privileges
    const effectiveRoles = [...allowedRoles];
    if (effectiveRoles.includes("admin") && !effectiveRoles.includes("superadmin")) {
      effectiveRoles.push("superadmin");
    }

    if (!effectiveRoles.includes(role)) {
      return next(new ApiError(403, "Access denied: insufficient permissions"));
    }

    next();
  };
}

/**
 * Prevents Insecure Direct Object Reference (IDOR)
 * Checks if the user requesting the resource owns it, or is an admin/superadmin
 */
export function checkResourceOwnership(getUserIdFromResource: (req: Request) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const { id: reqUserId, role } = req.user;

    // Admins and Super Admins bypass ownership checks
    if (role === "admin" || role === "superadmin") {
      return next();
    }

    try {
      const resourceOwnerId = await getUserIdFromResource(req);
      if (!resourceOwnerId) {
        return next(new ApiError(404, "Resource not found"));
      }

      if (resourceOwnerId.toString() !== reqUserId.toString()) {
        return next(new ApiError(403, "Access denied: you do not own this resource"));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
