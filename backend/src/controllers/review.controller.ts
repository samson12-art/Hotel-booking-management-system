import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { reviewSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const data = reviewSchema.parse(req.body);

    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.body.bookingId]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.userId !== req.user!.id) return sendError(res, "Not authorized.", 403);
    if (booking.status !== "CHECKED_OUT") return sendError(res, "Can only review after checkout.", 400);

    const existingReview = await getOne(`SELECT id FROM reviews WHERE "bookingId" = $1`, [req.body.bookingId]);
    if (existingReview) return sendError(res, "Review already exists for this booking.", 409);

    const files = req.files as Express.Multer.File[] | undefined;
    const photos = files ? files.map((f) => `/uploads/reviews/${f.filename}`) : data.photos || [];

    const result = await query(
      `INSERT INTO reviews (id, rating, comment, photos, "userId", "hotelId", "bookingId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [data.rating, data.comment || null, photos, req.user!.id, booking.hotelId, booking.id]
    );
    const review = result.rows[0];

    const user = await getOne(
      `SELECT id, "firstName", "lastName", "profilePicture" FROM users WHERE id = $1`,
      [req.user!.id]
    );

    sendSuccess(res, "Review created", { ...review, user }, 201);
  } catch (error: any) {
    if (error.name === "ZodError") return sendError(res, error.errors[0].message, 400);
    sendError(res, error.message, 500);
  }
};

export const getHotelReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));

    const countResult = await getOne(
      `SELECT COUNT(*) as count FROM reviews WHERE "hotelId" = $1`,
      [req.params.hotelId]
    );
    const total = parseInt(countResult.count);

    const reviews = await getMany(
      `SELECT r.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT id, "firstName", "lastName", "profilePicture" FROM users WHERE id = r."userId") u_data) as "user"
       FROM reviews r
       WHERE r."hotelId" = $1
       ORDER BY r."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [req.params.hotelId, limit, skip]
    );

    const stats = await getOne(
      `SELECT COALESCE(AVG(rating), 0) as "avgRating", COUNT(*) as "count"
       FROM reviews WHERE "hotelId" = $1`,
      [req.params.hotelId]
    );

    sendSuccess(res, "Reviews retrieved", { reviews, stats: { _avg: { rating: parseFloat(stats.avgRating) || 0 }, _count: { rating: parseInt(stats.count) } } }, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await getOne(`SELECT * FROM reviews WHERE id = $1`, [req.params.id]);
    if (!review) return sendError(res, "Review not found.", 404);
    if (review.userId !== req.user!.id) return sendError(res, "Not authorized.", 403);

    const updated = await getOne(
      `UPDATE reviews SET rating = $1, comment = $2, "updatedAt" = NOW()
       WHERE id = $3 RETURNING *`,
      [req.body.rating, req.body.comment, req.params.id]
    );
    const user = await getOne(
      `SELECT id, "firstName", "lastName", "profilePicture" FROM users WHERE id = $1`,
      [req.user!.id]
    );

    sendSuccess(res, "Review updated", { ...updated, user });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const review = await getOne(`SELECT * FROM reviews WHERE id = $1`, [req.params.id]);
    if (!review) return sendError(res, "Review not found.", 404);
    if (review.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }
    await query(`DELETE FROM reviews WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Review deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));

    const countResult = await getOne(`SELECT COUNT(*) as count FROM reviews`, []);
    const total = parseInt(countResult.count);

    const reviews = await getMany(
      `SELECT r.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT id, "firstName", "lastName" FROM users WHERE id = r."userId") u_data) as "user",
        (SELECT row_to_json(h_data.*) FROM (SELECT id, name FROM hotels WHERE id = r."hotelId") h_data) as hotel
       FROM reviews r
       ORDER BY r."createdAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, skip]
    );
    sendSuccess(res, "Reviews retrieved", reviews, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
