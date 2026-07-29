import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest, SearchFilters } from "../types";
import { hotelSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";

export const createHotel = async (req: AuthRequest, res: Response) => {
  try {
    const data = hotelSchema.parse(req.body);
    const result = await query(
      `INSERT INTO hotels (id, name, description, address, "cityId", "countryId", "starRating", "phoneNumber", email, website, latitude, longitude, "managerId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [data.name, data.description, data.address, data.cityId, data.countryId, data.starRating || 3, data.phoneNumber, data.email, data.website || null, data.latitude || null, data.longitude || null, req.user!.id]
    );
    sendSuccess(res, "Hotel created successfully", result.rows[0], 201);
  } catch (error: any) {
    if (error.name === "ZodError") return sendError(res, error.errors[0].message, 400);
    sendError(res, error.message, 500);
  }
};

export const updateHotel = async (req: AuthRequest, res: Response) => {
  try {
    const hotel = await getOne(`SELECT * FROM hotels WHERE id = $1`, [req.params.id]);
    if (!hotel) return sendError(res, "Hotel not found.", 404);
    if (hotel.managerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }

    const { name, description, address, cityId, countryId, starRating, phoneNumber, email, website, latitude, longitude, isActive } = req.body;
    const updated = await getOne(
      `UPDATE hotels SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        address = COALESCE($3, address),
        "cityId" = COALESCE($4, "cityId"),
        "countryId" = COALESCE($5, "countryId"),
        "starRating" = COALESCE($6, "starRating"),
        "phoneNumber" = COALESCE($7, "phoneNumber"),
        email = COALESCE($8, email),
        website = COALESCE($9, website),
        latitude = COALESCE($10, latitude),
        longitude = COALESCE($11, longitude),
        "isActive" = COALESCE($12, "isActive"),
        "updatedAt" = NOW()
       WHERE id = $13 RETURNING *`,
      [name, description, address, cityId, countryId, starRating, phoneNumber, email, website, latitude, longitude, isActive, req.params.id]
    );
    sendSuccess(res, "Hotel updated", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getHotelById = async (req: AuthRequest, res: Response) => {
  try {
    const hotel = await getOne(`SELECT * FROM hotels WHERE id = $1`, [req.params.id]);
    if (!hotel) return sendError(res, "Hotel not found.", 404);

    const images = await getMany(`SELECT * FROM hotel_images WHERE "hotelId" = $1`, [req.params.id]);
    const city = await getOne(`SELECT * FROM cities WHERE id = $1`, [hotel.cityId]);
    const country = await getOne(`SELECT * FROM countries WHERE id = $1`, [hotel.countryId]);
    const manager = await getOne(`SELECT id, "firstName", "lastName", email FROM users WHERE id = $1`, [hotel.managerId]);
    const amenities = await getMany(
      `SELECT a.* FROM amenities a INNER JOIN hotel_amenities ha ON a.id = ha."amenityId" WHERE ha."hotelId" = $1`,
      [req.params.id]
    );
    const policies = await getMany(`SELECT * FROM hotel_policies WHERE "hotelId" = $1`, [req.params.id]);
    const rooms = await getMany(
      `SELECT r.*,
        (SELECT COALESCE(json_agg(json_build_object('id', ri.id, 'url', ri.url, 'alt', ri.alt, 'isPrimary', ri."isPrimary"))
          FILTER (WHERE ri.id IS NOT NULL), '[]')
         FROM room_images ri WHERE ri."roomId" = r.id) as images
       FROM rooms r WHERE r."hotelId" = $1 AND r.status = 'AVAILABLE'`,
      [req.params.id]
    );
    const reviews = await getMany(
      `SELECT r.*, u."firstName", u."lastName", u."profilePicture"
       FROM reviews r
       INNER JOIN users u ON r."userId" = u.id
       WHERE r."hotelId" = $1
       ORDER BY r."createdAt" DESC LIMIT 10`,
      [req.params.id]
    );
    const counts = await getOne(
      `SELECT
        (SELECT COUNT(*) FROM reviews WHERE "hotelId" = $1) as "reviewCount",
        (SELECT COUNT(*) FROM rooms WHERE "hotelId" = $1) as "roomCount",
        (SELECT COUNT(*) FROM bookings WHERE "hotelId" = $1) as "bookingCount"`,
      [req.params.id]
    );
    const avgRating = await getOne(
      `SELECT COALESCE(AVG(rating), 0) as "averageRating" FROM reviews WHERE "hotelId" = $1`,
      [req.params.id]
    );

    sendSuccess(res, "Hotel retrieved", {
      ...hotel,
      city,
      country,
      manager,
      images,
      amenities,
      policies,
      rooms,
      reviews: reviews.map((r: any) => ({ ...r, user: { id: r.userId, firstName: r.firstName, lastName: r.lastName, profilePicture: r.profilePicture } })),
      _count: { reviews: parseInt(counts.reviewCount), rooms: parseInt(counts.roomCount), bookings: parseInt(counts.bookingCount) },
      averageRating: parseFloat(avgRating.averageRating) || 0,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllHotels = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const { query: searchQuery, cityId, countryId, minPrice, maxPrice, rating, sortBy } = req.query as any;

    const conditions: string[] = [`h."isActive" = true`];
    const params: any[] = [];
    let paramIndex = 1;

    if (searchQuery) {
      conditions.push(`(h.name ILIKE $${paramIndex} OR h.address ILIKE $${paramIndex})`);
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }
    if (cityId) {
      conditions.push(`h."cityId" = $${paramIndex++}`);
      params.push(cityId);
    }
    if (countryId) {
      conditions.push(`h."countryId" = $${paramIndex++}`);
      params.push(countryId);
    }
    if (rating) {
      conditions.push(`h."starRating" >= $${paramIndex++}`);
      params.push(Number(rating));
    }
    if (minPrice || maxPrice) {
      conditions.push(`h.id IN (SELECT "hotelId" FROM rooms WHERE price ${minPrice ? `>= $${paramIndex++}` : ">= 0"} ${maxPrice ? `AND price <= $${paramIndex++}` : ""})`);
      if (minPrice) params.push(Number(minPrice));
      if (maxPrice) params.push(Number(maxPrice));
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await getOne(`SELECT COUNT(DISTINCT h.id) as count FROM hotels h ${whereClause}`, params);
    const total = parseInt(countResult.count);

    let orderBy = `h."createdAt" DESC`;
    if (sortBy === "rating") orderBy = `h."starRating" DESC`;

    const hotels = await getMany(
      `SELECT h.*,
        (SELECT row_to_json(c.*) FROM cities c WHERE c.id = h."cityId") as city,
        (SELECT row_to_json(co.*) FROM countries co WHERE co.id = h."countryId") as country,
        (SELECT row_to_json(hi.*) FROM hotel_images hi WHERE hi."hotelId" = h.id AND hi."isPrimary" = true LIMIT 1) as "primaryImage",
        (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."hotelId" = h.id) as "averageRating",
        (SELECT COALESCE(MIN(r.price), 0) FROM rooms r WHERE r."hotelId" = h.id) as "minPrice",
        (SELECT COUNT(*) FROM reviews r WHERE r."hotelId" = h.id) as "reviewCount",
        (SELECT COUNT(*) FROM rooms r WHERE r."hotelId" = h.id) as "roomCount"
       FROM hotels h
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );

    const hotelsWithRating = hotels.map((h: any) => ({
      ...h,
      averageRating: Math.round(parseFloat(h.averageRating) * 10) / 10,
      minPrice: parseFloat(h.minPrice) || 0,
      _count: { reviews: parseInt(h.reviewCount), rooms: parseInt(h.roomCount) },
    }));

    sendSuccess(res, "Hotels retrieved", hotelsWithRating, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const deleteHotel = async (req: AuthRequest, res: Response) => {
  try {
    const hotel = await getOne(`SELECT managerId FROM hotels WHERE id = $1`, [req.params.id]);
    if (!hotel) return sendError(res, "Hotel not found.", 404);
    if (hotel.managerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }
    await query(`DELETE FROM hotels WHERE id = $1`, [req.params.id]);
    sendSuccess(res, "Hotel deleted.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const uploadHotelImages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return sendError(res, "No files uploaded.", 400);
    }
    const files = req.files as Express.Multer.File[];
    const images: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await query(
        `INSERT INTO hotel_images (id, url, "hotelId", "isPrimary", alt)
         VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *`,
        [`/uploads/hotels/${files[i].filename}`, req.params.id, i === 0, null]
      );
      images.push(result.rows[0]);
    }
    sendSuccess(res, "Images uploaded", images, 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const addHotelAmenity = async (req: AuthRequest, res: Response) => {
  try {
    const { amenityId } = req.body;
    const result = await query(
      `INSERT INTO hotel_amenities (id, "hotelId", "amenityId")
       VALUES (gen_random_uuid(), $1, $2) RETURNING *`,
      [req.params.id, amenityId]
    );
    sendSuccess(res, "Amenity added", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const removeHotelAmenity = async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `DELETE FROM hotel_amenities WHERE "hotelId" = $1 AND "amenityId" = $2`,
      [req.params.id, req.params.amenityId]
    );
    sendSuccess(res, "Amenity removed.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const addHotelPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const result = await query(
      `INSERT INTO hotel_policies (id, title, description, "hotelId")
       VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *`,
      [title, description, req.params.id]
    );
    sendSuccess(res, "Policy added", result.rows[0], 201);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const removeHotelPolicy = async (req: AuthRequest, res: Response) => {
  try {
    await query(`DELETE FROM hotel_policies WHERE id = $1`, [req.params.policyId]);
    sendSuccess(res, "Policy removed.");
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getManagerHotels = async (req: AuthRequest, res: Response) => {
  try {
    const hotels = await getMany(
      `SELECT h.*,
        (SELECT row_to_json(c.*) FROM cities c WHERE c.id = h."cityId") as city,
        (SELECT row_to_json(co.*) FROM countries co WHERE co.id = h."countryId") as country,
        (SELECT COUNT(*) FROM rooms r WHERE r."hotelId" = h.id) as "roomCount",
        (SELECT COUNT(*) FROM bookings b WHERE b."hotelId" = h.id) as "bookingCount",
        (SELECT COUNT(*) FROM reviews rv WHERE rv."hotelId" = h.id) as "reviewCount"
       FROM hotels h WHERE h."managerId" = $1
       ORDER BY h."createdAt" DESC`,
      [req.user!.id]
    );
    sendSuccess(res, "Hotels retrieved", hotels);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
