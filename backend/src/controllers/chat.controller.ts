import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, bookingId, message } = req.body;
    if (!receiverId || !message) return sendError(res, "Receiver and message required.", 400);

    const msg = await getOne(
      `INSERT INTO chat_messages (id, "senderId", "receiverId", "bookingId", message, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())
       RETURNING *`,
      [req.user!.id, receiverId, bookingId || null, message]
    );

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())`,
      ["New Message", `You have a new message: ${message.substring(0, 50)}...`, "GENERAL", receiverId]
    );

    sendSuccess(res, "Message sent", msg, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const messages = await getMany(
      `SELECT cm.*,
        (SELECT row_to_json(s.*) FROM (SELECT "firstName", "lastName", "profilePicture" FROM users WHERE id = cm."senderId") s) as sender,
        (SELECT row_to_json(r.*) FROM (SELECT "firstName", "lastName", "profilePicture" FROM users WHERE id = cm."receiverId") r) as receiver
       FROM chat_messages cm
       WHERE (cm."senderId" = $1 AND cm."receiverId" = $2)
          OR (cm."senderId" = $2 AND cm."receiverId" = $1)
       ORDER BY cm."createdAt" ASC`,
      [req.user!.id, userId]
    );

    await query(
      `UPDATE chat_messages SET "isRead" = true
       WHERE "senderId" = $1 AND "receiverId" = $2 AND "isRead" = false`,
      [userId, req.user!.id]
    );

    sendSuccess(res, "Conversation retrieved", messages);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getMyConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await getMany(
      `WITH latest_msgs AS (
        SELECT DISTINCT ON (LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId"))
          cm.*,
          (SELECT row_to_json(u.*) FROM (SELECT id, "firstName", "lastName", "profilePicture" FROM users WHERE id = CASE WHEN cm."senderId" = $1 THEN cm."receiverId" ELSE cm."senderId" END) u) as other_user
        FROM chat_messages cm
        WHERE cm."senderId" = $1 OR cm."receiverId" = $1
        ORDER BY LEAST("senderId", "receiverId"), GREATEST("senderId", "receiverId"), cm."createdAt" DESC
      )
      SELECT * FROM latest_msgs ORDER BY "createdAt" DESC`,
      [req.user!.id]
    );

    const unreadCount = await getOne(
      `SELECT COUNT(*) as count FROM chat_messages WHERE "receiverId" = $1 AND "isRead" = false`,
      [req.user!.id]
    );

    sendSuccess(res, "Conversations retrieved", {
      conversations,
      unreadCount: parseInt(unreadCount.count),
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const markMessageRead = async (req: AuthRequest, res: Response) => {
  try {
    await query(`UPDATE chat_messages SET "isRead" = true WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Message marked as read.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
