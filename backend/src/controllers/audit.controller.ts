import { Response } from "express";
import { getOne, getMany } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const action = req.query.action as string;
    const userId = req.query.userId as string;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (action) {
      conditions.push(`a.action = $${paramIndex++}`);
      params.push(action);
    }
    if (userId) {
      conditions.push(`a."userId" = $${paramIndex++}`);
      params.push(userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await getOne(`SELECT COUNT(*) as count FROM audit_logs a ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const logs = await getMany(
      `SELECT a.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName", email FROM users WHERE id = a."userId") u_data) as "user"
       FROM audit_logs a
       ${whereClause}
       ORDER BY a."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    sendSuccess(res, "Audit logs retrieved", logs, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAuditLogById = async (req: AuthRequest, res: Response) => {
  try {
    const log = await getOne(
      `SELECT a.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName", email FROM users WHERE id = a."userId") u_data) as "user"
       FROM audit_logs a WHERE a.id = $1`,
      [req.params.id]
    );
    if (!log) return sendError(res, "Audit log not found.", 404);
    sendSuccess(res, "Audit log retrieved", log);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
