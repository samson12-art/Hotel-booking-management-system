import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));

    const countResult = await getOne(
      `SELECT COUNT(*) as count FROM notifications WHERE "userId" = $1`,
      [req.user!.id]
    );
    const total = parseInt(countResult.count);

    const unreadResult = await getOne(
      `SELECT COUNT(*) as count FROM notifications WHERE "userId" = $1 AND "isRead" = false`,
      [req.user!.id]
    );
    const unreadCount = parseInt(unreadResult.count);

    const notifications = await getMany(
      `SELECT * FROM notifications
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, skip]
    );

    sendSuccess(res, "Notifications retrieved", { notifications, unreadCount }, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `UPDATE notifications SET "isRead" = true WHERE id = $1`,
      [req.params.id]
    );
    sendSuccess(res, "Notification marked as read.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `UPDATE notifications SET "isRead" = true WHERE "userId" = $1 AND "isRead" = false`,
      [req.user!.id]
    );
    sendSuccess(res, "All notifications marked as read.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM notifications WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Notification deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
