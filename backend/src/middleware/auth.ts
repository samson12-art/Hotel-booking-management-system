import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getOne } from "../config/database";
import { AuthRequest, AuthUser } from "../types";
import { sendError } from "../utils/response";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "No token provided. Authorization denied.", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    const user = await getOne(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (!user) {
      return sendError(res, "User not found.", 401);
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token expired.", 401);
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token.", 401);
    }
    return sendError(res, "Authentication failed.", 500);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, "Insufficient permissions.", 403);
    }
    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await getOne(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (user) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};
