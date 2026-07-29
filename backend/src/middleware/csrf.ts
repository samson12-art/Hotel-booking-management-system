import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { getOne, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendError } from "../utils/response";

const EXCLUDED_METHODS = ["GET", "HEAD", "OPTIONS"];

export const csrfProtection = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (EXCLUDED_METHODS.includes(req.method)) return next();

  const token = req.headers["x-csrf-token"] as string;
  if (!token) return sendError(res, "CSRF token required.", 403);

  if (!req.user) return sendError(res, "Authentication required.", 401);

  const stored = await getOne(
    `SELECT id FROM csrf_tokens WHERE token = $1 AND "userId" = $2 AND expires > NOW()`,
    [token, req.user.id]
  );

  if (!stored) return sendError(res, "Invalid or expired CSRF token.", 403);

  await query(`DELETE FROM csrf_tokens WHERE id = $1`, [stored.id]);
  next();
};

export const generateCsrfToken = async (userId: string): Promise<string> => {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600000);
  await query(
    `INSERT INTO csrf_tokens (id, "userId", token, expires, "createdAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())`,
    [userId, token, expires]
  );
  return token;
};
