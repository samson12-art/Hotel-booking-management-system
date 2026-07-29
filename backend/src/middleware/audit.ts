import { Response, NextFunction } from "express";
import { query } from "../config/database";
import { AuthRequest } from "../types";

export const auditLog = (action: string, entity?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const entityId = req.params.id || req.body?.id || body?.data?.id;
      if (req.user) {
        query(
          `INSERT INTO audit_logs (id, "userId", action, entity, "entityId", details, ip, "userAgent", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            req.user.id,
            action,
            entity || "",
            entityId || "",
            JSON.stringify({ method: req.method, path: req.path, body: req.method !== "GET" ? req.body : undefined }),
            req.ip,
            req.headers["user-agent"] || "",
          ]
        ).catch((err) => console.error("Audit log error:", err.message));
      }
      return originalJson(body);
    };
    next();
  };
};
