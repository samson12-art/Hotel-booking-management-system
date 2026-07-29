import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const createContact = async (req: AuthRequest, res: Response) => {
  try {
    const { hotelId, name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return sendError(res, "Name, email, and message are required.", 400);
    }

    const contact = await getOne(
      `INSERT INTO contacts (id, "hotelId", name, email, phone, subject, message, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [hotelId || null, name, email, phone || null, subject || null, message]
    );

    if (hotelId) {
      const hotel = await getOne(`SELECT "managerId", name FROM hotels WHERE id = $1`, [hotelId]);
      if (hotel) {
        await query(
          `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())`,
          ["New Contact Request", `New inquiry for ${hotel.name} from ${name}`, "GENERAL", hotel.managerId]
        );
      }
    }

    sendSuccess(res, "Message sent successfully", contact, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getHotelContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const conditions: string[] = [`c."hotelId" = $1`];
    const params: any[] = [req.params.hotelId];
    let paramIndex = 2;

    const countResult = await getOne(`SELECT COUNT(*) as count FROM contacts c WHERE ${conditions.join(" AND ")}`, params);
    const total = parseInt(countResult.count);

    const contacts = await getMany(
      `SELECT * FROM contacts c WHERE ${conditions.join(" AND ")}
       ORDER BY c."createdAt" DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    sendSuccess(res, "Contacts retrieved", contacts, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const countResult = await getOne(`SELECT COUNT(*) as count FROM contacts`, []);
    const total = parseInt(countResult.count);

    const contacts = await getMany(
      `SELECT c.*,
        (SELECT row_to_json(h_data.*) FROM (SELECT name FROM hotels WHERE id = c."hotelId") h_data) as hotel
       FROM contacts c ORDER BY c."createdAt" DESC LIMIT $1 OFFSET $2`,
      [limit, skip]
    );

    sendSuccess(res, "Contacts retrieved", contacts, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const markContactRead = async (req: AuthRequest, res: Response) => {
  try {
    await query(`UPDATE contacts SET "isRead" = true WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Contact marked as read.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM contacts WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Contact deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
