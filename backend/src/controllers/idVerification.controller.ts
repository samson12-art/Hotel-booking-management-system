import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const uploadIdDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return sendError(res, "No file uploaded.", 400);

    const documentUrl = `/uploads/ids/${req.file.filename}`;
    const user = await getOne(
      `UPDATE users
       SET "idDocumentUrl" = $1, "idVerificationStatus" = 'PENDING', "idVerificationNote" = NULL, "updatedAt" = NOW()
       WHERE id = $2
       RETURNING id, email, "firstName", "lastName", "idDocumentUrl", "idVerificationStatus"`,
      [documentUrl, req.user!.id]
    );
    sendSuccess(res, "ID document uploaded. Pending verification.", user);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getIdVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne(
      `SELECT id, "idDocumentUrl", "idVerificationStatus", "idVerificationNote"
       FROM users WHERE id = $1`,
      [req.user!.id]
    );
    sendSuccess(res, "ID verification status retrieved", {
      status: user.idVerificationStatus || "NONE",
      documentUrl: user.idDocumentUrl,
      note: user.idVerificationNote,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getPendingVerifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string;

    const conditions: string[] = [`"idVerificationStatus" IS NOT NULL`, `"idVerificationStatus" != 'NONE'`];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`"idVerificationStatus" = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await getOne(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const users = await getMany(
      `SELECT id, email, "firstName", "lastName", phone, "idDocumentUrl", "idVerificationStatus", "idVerificationNote", "createdAt"
       FROM users ${whereClause}
       ORDER BY "createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    sendSuccess(res, "Verifications retrieved", users, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const reviewIdDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
      return sendError(res, "Status must be VERIFIED or REJECTED.", 400);
    }

    const targetUser = await getOne(`SELECT id, "idDocumentUrl" FROM users WHERE id = $1`, [req.params.id]);
    if (!targetUser) return sendError(res, "User not found.", 404);
    if (!targetUser.idDocumentUrl) return sendError(res, "No ID document uploaded by this user.", 400);

    const updated = await getOne(
      `UPDATE users
       SET "idVerificationStatus" = $1, "idVerificationNote" = $2, "isVerified" = $3, "updatedAt" = NOW()
       WHERE id = $4
       RETURNING id, email, "firstName", "lastName", "idVerificationStatus", "idVerificationNote", "isVerified"`,
      [status, note || null, status === "VERIFIED", req.params.id]
    );

    const notificationMessage = status === "VERIFIED"
      ? "Your ID has been verified. Your account is now fully verified."
      : `Your ID verification was rejected. ${note ? `Reason: ${note}` : "Please upload a new document."}`;

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["ID Verification Update", notificationMessage, "GENERAL", req.params.id]
    );

    sendSuccess(res, `ID document ${status.toLowerCase()}`, updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
