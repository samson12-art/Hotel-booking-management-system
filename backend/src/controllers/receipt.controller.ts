import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const uploadReceipt = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return sendError(res, "No file uploaded.", 400);

    const { bookingId, amount, paymentMethod } = req.body;
    if (!bookingId || !amount || !paymentMethod) {
      return sendError(res, "bookingId, amount, and paymentMethod are required.", 400);
    }

    const booking = await getOne(`SELECT id, "userId" FROM bookings WHERE id = $1`, [bookingId]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }

    const receipt = await getOne(
      `INSERT INTO receipts (id, "fileUrl", "originalName", amount, "paymentMethod", status, "userId", "bookingId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'PENDING', $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        `/uploads/receipts/${req.file.filename}`,
        req.file.originalname,
        parseFloat(amount),
        paymentMethod,
        req.user!.id,
        bookingId,
      ]
    );

    sendSuccess(res, "Receipt uploaded. Pending verification.", receipt, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getMyReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));

    const countResult = await getOne(`SELECT COUNT(*) as count FROM receipts WHERE "userId" = $1`, [req.user!.id]);
    const total = parseInt(countResult.count);

    const receipts = await getMany(
      `SELECT r.*,
        (SELECT row_to_json(b_data.*) FROM (SELECT b."bookingNumber", b."checkIn", b."checkOut",
          (SELECT row_to_json(h.*) FROM hotels h WHERE h.id = b."hotelId") as hotel
         FROM bookings b WHERE b.id = r."bookingId") b_data) as booking
       FROM receipts r
       WHERE r."userId" = $1
       ORDER BY r."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, skip]
    );

    sendSuccess(res, "Receipts retrieved", receipts, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllReceipts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`r.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await getOne(`SELECT COUNT(*) as count FROM receipts r ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const receipts = await getMany(
      `SELECT r.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName", email FROM users WHERE id = r."userId") u_data) as "user",
        (SELECT row_to_json(b_data.*) FROM (SELECT b."bookingNumber",
          (SELECT row_to_json(h.*) FROM hotels h WHERE h.id = b."hotelId") as hotel
         FROM bookings b WHERE b.id = r."bookingId") b_data) as booking
       FROM receipts r
       ${whereClause}
       ORDER BY r."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    sendSuccess(res, "Receipts retrieved", receipts, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const reviewReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
      return sendError(res, "Status must be VERIFIED or REJECTED.", 400);
    }

    const receipt = await getOne(`SELECT * FROM receipts WHERE id = $1`, [req.params.id]);
    if (!receipt) return sendError(res, "Receipt not found.", 404);

    const updated = await getOne(
      `UPDATE receipts SET status = $1, note = $2, "verifiedBy" = $3, "updatedAt" = NOW()
       WHERE id = $4 RETURNING *`,
      [status, note || null, req.user!.id, req.params.id]
    );

    if (status === "VERIFIED") {
      const existingPayment = await getOne(
        `SELECT id FROM payments WHERE "bookingId" = $1 AND status = 'COMPLETED'`,
        [receipt.bookingId]
      );
      if (!existingPayment) {
        const { v4: uuidv4 } = require("uuid");
        const { generateInvoiceNumber } = require("../utils/helpers");
        await query(
          `INSERT INTO payments (id, amount, method, status, "transactionId", "invoiceNumber", "bookingId", "userId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, 'COMPLETED', $4, $5, $6, $7, NOW(), NOW())`,
          [uuidv4(), receipt.amount, receipt.paymentMethod, `RECEIPT-${receipt.id.slice(0, 8)}`, generateInvoiceNumber(), receipt.bookingId, receipt.userId]
        );
        await query(`UPDATE bookings SET status = 'CONFIRMED', "updatedAt" = NOW() WHERE id = $1`, [receipt.bookingId]);
      }
    }

    const notificationMessage = status === "VERIFIED"
      ? `Your receipt for $${receipt.amount.toFixed(2)} has been verified. Payment confirmed.`
      : `Your receipt was rejected. ${note ? `Reason: ${note}` : "Please upload a valid receipt."}`;

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Receipt Verification Update", notificationMessage, "GENERAL", receipt.userId]
    );

    sendSuccess(res, `Receipt ${status.toLowerCase()}`, updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
