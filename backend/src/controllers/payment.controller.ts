import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { paymentSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";
import { generateInvoiceNumber } from "../utils/helpers";
import { getPaginationParams, buildPagination } from "../utils/pagination";
import { transitionBookingStatus } from "../services/booking.service";

export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const data = paymentSchema.parse(req.body);

    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [data.bookingId]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.userId !== req.user!.id) return sendError(res, "Not authorized.", 403);

    const existingPayment = await getOne(
      `SELECT id FROM payments WHERE "bookingId" = $1 AND status = 'COMPLETED'`,
      [data.bookingId]
    );
    if (existingPayment) return sendError(res, "Booking already paid.", 400);

    const mockTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    let paymentStatus = "COMPLETED";
    if (data.method === "CASH") paymentStatus = "PENDING";

    const payment = await getOne(
      `INSERT INTO payments (id, amount, method, status, "transactionId", "invoiceNumber", "bookingId", "userId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [booking.totalAmount, data.method, paymentStatus, data.transactionId || mockTransactionId, generateInvoiceNumber(), data.bookingId, req.user!.id]
    );

    const hotel = await getOne(`SELECT name FROM hotels WHERE id = $1`, [booking.hotelId]);

    if (paymentStatus === "COMPLETED") {
      await transitionBookingStatus(data.bookingId, "CONFIRMED");
    }

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Payment Received", `Payment of $${booking.totalAmount.toFixed(2)} received for booking.`, "PAYMENT_RECEIVED", req.user!.id]
    );

    sendSuccess(res, "Payment processed successfully", { ...payment, booking: { hotel } }, 201);
  } catch (error: any) {
    if (error.name === "ZodError") return sendError(res, error.errors[0].message, 400);
    sendError(res, error.message, 500);
  }
};

export const getMyPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));

    const countResult = await getOne(`SELECT COUNT(*) as count FROM payments WHERE "userId" = $1`, [req.user!.id]);
    const total = parseInt(countResult.count);

    const payments = await getMany(
      `SELECT p.*,
        (SELECT row_to_json(b_data.*) FROM (SELECT b."bookingNumber", b."checkIn", b."checkOut",
          (SELECT row_to_json(h.*) FROM hotels h WHERE h.id = b."hotelId") as hotel
         FROM bookings b WHERE b.id = p."bookingId") b_data) as booking
       FROM payments p
       WHERE p."userId" = $1
       ORDER BY p."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.id, limit, skip]
    );
    sendSuccess(res, "Payments retrieved", payments, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getPaymentById = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await getOne(`SELECT * FROM payments WHERE id = $1`, [req.params.id]);
    if (!payment) return sendError(res, "Payment not found.", 404);
    if (payment.userId !== req.user!.id && req.user!.role === "CUSTOMER") {
      return sendError(res, "Not authorized.", 403);
    }

    const booking = await getOne(
      `SELECT b.*,
        (SELECT row_to_json(h.*) FROM hotels h WHERE h.id = b."hotelId") as hotel,
        (SELECT COALESCE(json_agg(json_build_object('roomNumber', r."roomNumber', 'type', r.type)), '[]')
         FROM booking_details bd INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = b.id) as "bookingDetails"
       FROM bookings b WHERE b.id = $1`,
      [payment.bookingId]
    );
    const user = await getOne(
      `SELECT "firstName", "lastName", email, phone FROM users WHERE id = $1`,
      [payment.userId]
    );

    sendSuccess(res, "Payment retrieved", { ...payment, booking, user });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string;
    const method = req.query.method as string;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    if (status) {
      conditions.push(`p.status = $${paramIndex++}`);
      params.push(status);
    }
    if (method) {
      conditions.push(`p.method = $${paramIndex++}`);
      params.push(method);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await getOne(`SELECT COUNT(*) as count FROM payments p ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const payments = await getMany(
      `SELECT p.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName", email FROM users WHERE id = p."userId") u_data) as "user",
        (SELECT row_to_json(b_data.*) FROM (SELECT b."bookingNumber",
          (SELECT row_to_json(h.*) FROM hotels h WHERE h.id = b."hotelId") as hotel
         FROM bookings b WHERE b.id = p."bookingId") b_data) as booking
       FROM payments p
       ${whereClause}
       ORDER BY p."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );
    sendSuccess(res, "Payments retrieved", payments, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const payment = await getOne(`SELECT * FROM payments WHERE id = $1`, [req.params.id]);
    if (!payment) return sendError(res, "Payment not found.", 404);
    if (payment.status !== "COMPLETED") return sendError(res, "Can only refund completed payments.", 400);

    const updated = await getOne(
      `UPDATE payments SET status = 'REFUNDED', "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await transitionBookingStatus(payment.bookingId, "CANCELLED");

    sendSuccess(res, "Payment refunded", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
