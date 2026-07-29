import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { roomSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";

export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    const data = roomSchema.parse({ ...req.body, hotelId: req.params.hotelId });
    const hotel = await getOne(`SELECT "managerId" FROM hotels WHERE id = $1`, [req.params.hotelId]);
    if (!hotel) return sendError(res, "Hotel not found.", 404);
    if (hotel.managerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }

    const result = await query(
      `INSERT INTO rooms (id, "roomNumber", type, description, capacity, beds, bathroom, price, status, "hotelId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [data.roomNumber, data.type, data.description || null, data.capacity || 2, data.beds || 1, data.bathroom || "Private", data.price, data.status || "AVAILABLE", req.params.hotelId]
    );
    sendSuccess(res, "Room created", result.rows[0], 201);
  } catch (error: any) {
    if (error.name === "ZodError") return sendError(res, error.errors[0].message, 400);
    sendError(res, error.message, 500);
  }
};

export const updateRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await getOne(
      `SELECT r.*, h."managerId" FROM rooms r
       INNER JOIN hotels h ON r."hotelId" = h.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!room) return sendError(res, "Room not found.", 404);
    if (room.managerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }

    const { roomNumber, type, description, capacity, beds, bathroom, price, status } = req.body;
    const updated = await getOne(
      `UPDATE rooms SET
        "roomNumber" = COALESCE($1, "roomNumber"),
        type = COALESCE($2, type),
        description = COALESCE($3, description),
        capacity = COALESCE($4, capacity),
        beds = COALESCE($5, beds),
        bathroom = COALESCE($6, bathroom),
        price = COALESCE($7, price),
        status = COALESCE($8, status),
        "updatedAt" = NOW()
       WHERE id = $9 RETURNING *`,
      [roomNumber, type, description, capacity, beds, bathroom, price, status, req.params.id]
    );
    sendSuccess(res, "Room updated", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getRoomById = async (req: AuthRequest, res: Response) => {
  try {
    const room = await getOne(`SELECT * FROM rooms WHERE id = $1`, [req.params.id]);
    if (!room) return sendError(res, "Room not found.", 404);

    const hotel = await getOne(`SELECT id, name, address FROM hotels WHERE id = $1`, [room.hotelId]);
    const images = await getMany(`SELECT * FROM room_images WHERE "roomId" = $1`, [req.params.id]);
    const amenities = await getMany(
      `SELECT a.* FROM amenities a
       INNER JOIN room_amenities ra ON a.id = ra."amenityId"
       WHERE ra."roomId" = $1`,
      [req.params.id]
    );
    const seasonalPricing = await getMany(
      `SELECT * FROM seasonal_pricing WHERE "roomId" = $1`,
      [req.params.id]
    );

    sendSuccess(res, "Room retrieved", { ...room, hotel, images, amenities, seasonalPricing });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getHotelRooms = async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, minPrice, maxPrice } = req.query as any;
    const conditions: string[] = [`r."hotelId" = $1`];
    const params: any[] = [req.params.hotelId];
    let paramIndex = 2;

    if (type) {
      conditions.push(`r.type = $${paramIndex++}`);
      params.push(type);
    }
    if (status) {
      conditions.push(`r.status = $${paramIndex++}`);
      params.push(status);
    }
    if (minPrice) {
      conditions.push(`r.price >= $${paramIndex++}`);
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      conditions.push(`r.price <= $${paramIndex++}`);
      params.push(Number(maxPrice));
    }

    const rooms = await getMany(
      `SELECT r.*,
        (SELECT COALESCE(json_agg(json_build_object('id', ri.id, 'url', ri.url, 'alt', ri.alt, 'isPrimary', ri."isPrimary"))
          FILTER (WHERE ri.id IS NOT NULL), '[]')
         FROM room_images ri WHERE ri."roomId" = r.id) as images
       FROM rooms r
       WHERE ${conditions.join(" AND ")}
       ORDER BY r.price ASC`,
      params
    );
    sendSuccess(res, "Rooms retrieved", rooms);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const checkAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, checkIn, checkOut } = req.query as any;
    if (!roomId || !checkIn || !checkOut) {
      return sendError(res, "roomId, checkIn, and checkOut are required.", 400);
    }

    const overlapping = await getOne(
      `SELECT COUNT(*) as count FROM booking_details bd
       INNER JOIN bookings b ON bd."bookingId" = b.id
       WHERE bd."roomId" = $1
         AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
         AND b."checkIn" < $3
         AND b."checkOut" > $2`,
      [roomId, checkIn, checkOut]
    );

    sendSuccess(res, "Availability checked", { available: parseInt(overlapping.count) === 0 });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const updateRoomStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, "Status is required.", 400);

    const room = await getOne(
      `UPDATE rooms SET status = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    sendSuccess(res, "Room status updated", room);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response) => {
  try {
    const room = await getOne(
      `SELECT r.id, h."managerId" FROM rooms r
       INNER JOIN hotels h ON r."hotelId" = h.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!room) return sendError(res, "Room not found.", 404);
    if (room.managerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }
    await query(`DELETE FROM rooms WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Room deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const uploadRoomImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return sendError(res, "No files uploaded.", 400);
    }
    const files = req.files as Express.Multer.File[];
    const images: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await query(
        `INSERT INTO room_images (id, url, "roomId", "isPrimary", alt)
         VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
        [`/uploads/rooms/${files[i].filename}`, req.params.id, i === 0, null]
      );
      images.push(result.rows[0]);
    }
    sendSuccess(res, "Images uploaded", images, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const addRoomAmenity = async (req: AuthRequest, res: Response) => {
  try {
    const { amenityId } = req.body;
    const result = await query(
      `INSERT INTO room_amenities (id, "roomId", "amenityId")
       VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
      [req.params.id, amenityId]
    );
    sendSuccess(res, "Amenity added", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const removeRoomAmenity = async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `DELETE FROM room_amenities WHERE "roomId" = $1 AND "amenityId" = $2`,
      [req.params.id, req.params.amenityId]
    );
    sendSuccess(res, "Amenity removed.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const setSeasonalPricing = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, price } = req.body;
    const result = await query(
      `INSERT INTO seasonal_pricing (id, "roomId", "startDate", "endDate", price)
       VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
      [req.params.id, new Date(startDate), new Date(endDate), price]
    );
    sendSuccess(res, "Seasonal pricing set", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
