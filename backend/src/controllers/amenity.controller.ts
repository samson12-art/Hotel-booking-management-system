import { Response } from "express";
import { getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export const createAmenity = async (req: AuthRequest, res: Response) => {
  try {
    const { name, icon } = req.body;
    if (!name) return sendError(res, "Amenity name is required.", 400);
    const result = await query(
      `INSERT INTO amenities (id, name, icon) VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
      [name, icon || null]
    );
    sendSuccess(res, "Amenity created", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllAmenities = async (req: AuthRequest, res: Response) => {
  try {
    const amenities = await getMany(`SELECT * FROM amenities ORDER BY name ASC`, []);
    sendSuccess(res, "Amenities retrieved", amenities);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteAmenity = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM amenities WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Amenity deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
