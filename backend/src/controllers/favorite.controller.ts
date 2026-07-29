import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { hotelId } = req.body;
    if (!hotelId) return sendError(res, "hotelId is required.", 400);

    const existing = await getOne(
      `SELECT id FROM favorites WHERE "userId" = $1 AND "hotelId" = $2`,
      [req.user!.id, hotelId]
    );
    if (existing) return sendError(res, "Already in favorites.", 409);

    const result = await query(
      `INSERT INTO favorites (id, "userId", "hotelId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, NOW())
       RETURNING *`,
      [req.user!.id, hotelId]
    );
    const hotel = await getOne(`SELECT id, name FROM hotels WHERE id = $1`, [hotelId]);
    sendSuccess(res, "Added to favorites", { ...result.rows[0], hotel }, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `DELETE FROM favorites WHERE "userId" = $1 AND "hotelId" = $2`,
      [req.user!.id, req.params.hotelId]
    );
    sendSuccess(res, "Removed from favorites.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getMyFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await getMany(
      `SELECT f.*,
        (SELECT row_to_json(h_data.*) FROM (
          SELECT h.*,
            (SELECT row_to_json(c.*) FROM cities c WHERE c.id = h."cityId") as city,
            (SELECT row_to_json(hi.*) FROM hotel_images hi WHERE hi."hotelId" = h.id AND hi."isPrimary" = true LIMIT 1) as "primaryImage",
            (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."hotelId" = h.id) as "averageRating"
          FROM hotels h WHERE h.id = f."hotelId"
        ) h_data) as hotel
       FROM favorites f
       WHERE f."userId" = $1
       ORDER BY f."createdAt" DESC`,
      [req.user!.id]
    );

    const result = favorites.map((f: any) => ({
      ...f,
      hotel: {
        ...f.hotel,
        averageRating: Math.round(parseFloat(f.hotel.averageRating) * 10) / 10,
      },
    }));

    sendSuccess(res, "Favorites retrieved", result);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
