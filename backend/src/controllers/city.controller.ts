import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export const createCity = async (req: AuthRequest, res: Response) => {
  try {
    const { name, countryId } = req.body;
    if (!name || !countryId) return sendError(res, "Name and countryId are required.", 400);
    const result = await query(
      `INSERT INTO cities (id, name, "countryId") VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
      [name, countryId]
    );
    sendSuccess(res, "City created", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllCities = async (req: AuthRequest, res: Response) => {
  try {
    const { countryId } = req.query as any;
    let cities;
    if (countryId) {
      cities = await getMany(
        `SELECT c.*, row_to_json(co.*) as country,
          (SELECT COUNT(*) FROM hotels h WHERE h."cityId" = c.id AND h."isActive" = true) as "hotelCount"
         FROM cities c INNER JOIN countries co ON c."countryId" = co.id
         WHERE c."countryId" = $1 ORDER BY c.name ASC`,
        [countryId]
      );
    } else {
      cities = await getMany(
        `SELECT c.*, row_to_json(co.*) as country,
          (SELECT COUNT(*) FROM hotels h WHERE h."cityId" = c.id AND h."isActive" = true) as "hotelCount"
         FROM cities c INNER JOIN countries co ON c."countryId" = co.id
         ORDER BY c.name ASC`,
        []
      );
    }
    sendSuccess(res, "Cities retrieved", cities);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteCity = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM cities WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "City deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const createCountry = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return sendError(res, "Name and code are required.", 400);
    const result = await query(
      `INSERT INTO countries (id, name, code) VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
      [name, code]
    );
    sendSuccess(res, "Country created", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllCountries = async (req: AuthRequest, res: Response) => {
  try {
    const countries = await getMany(
      `SELECT co.*,
        (SELECT COUNT(*) FROM cities c WHERE c."countryId" = co.id) as "cityCount",
        (SELECT COUNT(*) FROM hotels h WHERE h."countryId" = co.id) as "hotelCount"
       FROM countries co ORDER BY co.name ASC`,
      []
    );
    sendSuccess(res, "Countries retrieved", countries);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
