import { getMany, getOne, query } from "../config/database";

export const generateRecommendations = async (userId: string): Promise<any[]> => {
  const userBookings = await getMany(
    `SELECT DISTINCT h.id, h.name, h."starRating",
      ARRAY_AGG(DISTINCT ha."amenityId") as amenity_ids
     FROM bookings b
     INNER JOIN hotels h ON b."hotelId" = h.id
     LEFT JOIN hotel_amenities ha ON h.id = ha."hotelId"
     WHERE b."userId" = $1
     GROUP BY h.id`,
    [userId]
  );

  const userFavorites = await getMany(
    `SELECT h.id, h.name, h."starRating",
      ARRAY_AGG(DISTINCT ha."amenityId") as amenity_ids
     FROM favorites f
     INNER JOIN hotels h ON f."hotelId" = h.id
     LEFT JOIN hotel_amenities ha ON h.id = ha."hotelId"
     WHERE f."userId" = $1
     GROUP BY h.id`,
    [userId]
  );

  const pastHotelIds = [...userBookings, ...userFavorites].map((h: any) => h.id);
  const userAmenityIds = [...new Set(
    [...userBookings, ...userFavorites].flatMap((h: any) => h.amenity_ids || [])
  )];

  let recommendations: any[] = [];

  if (userAmenityIds.length > 0) {
    const similarHotels = await getMany(
      `SELECT h.id, h.name, h."starRating", h.description,
        COUNT(ha."amenityId") as matching_amenities,
        (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."hotelId" = h.id) as avg_rating
       FROM hotels h
       INNER JOIN hotel_amenities ha ON h.id = ha."hotelId"
       WHERE ha."amenityId" = ANY($1::text[])
       AND h.id != ALL($2::text[])
       AND h."isActive" = true
       GROUP BY h.id
       ORDER BY matching_amenities DESC, avg_rating DESC
       LIMIT 5`,
      [userAmenityIds, pastHotelIds.length > 0 ? pastHotelIds : ["none"]]
    );
    recommendations = similarHotels;
  }

  if (recommendations.length < 3) {
    const popularHotels = await getMany(
      `SELECT h.id, h.name, h."starRating", h.description,
        0 as matching_amenities,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(b.id) as booking_count
       FROM hotels h
       LEFT JOIN reviews r ON h.id = r."hotelId"
       LEFT JOIN bookings b ON h.id = b."hotelId"
       WHERE h.id != ALL($1::text[])
       AND h."isActive" = true
       GROUP BY h.id
       ORDER BY booking_count DESC, avg_rating DESC
       LIMIT 6`,
      [pastHotelIds.length > 0 ? pastHotelIds : ["none"]]
    );
    recommendations = [...recommendations, ...popularHotels];
  }

  for (const rec of recommendations.slice(0, 5)) {
    const score = rec.matching_amenities
      ? Math.min(5, (rec.matching_amenities * 1.5 + (rec.avg_rating || 0) * 0.5))
      : Math.min(5, (rec.avg_rating || 0) + 1);
    const reason = rec.matching_amenities > 0
      ? "Based on your past preferences"
      : "Popular choice among guests";

    await query(
      `INSERT INTO recommendations (id, "userId", "hotelId", score, reason, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())
       ON CONFLICT ("userId", "hotelId") DO UPDATE SET score = $3, reason = $4, "createdAt" = NOW()`,
      [userId, rec.id, score, reason]
    );
  }

  return recommendations.slice(0, 5).map((r: any) => ({
    ...r,
    score: r.matching_amenities
      ? Math.min(5, (r.matching_amenities * 1.5 + (r.avg_rating || 0) * 0.5))
      : Math.min(5, (r.avg_rating || 0) + 1),
    reason: r.matching_amenities > 0 ? "Based on your past preferences" : "Popular choice among guests",
  }));
};

export const getRecommendations = async (userId: string): Promise<any[]> => {
  let recs = await getMany(
    `SELECT r.*, h.name, h."starRating", h.description,
      (SELECT COALESCE(json_agg(json_build_object('url', hi.url, 'isPrimary', hi."isPrimary")), '[]')
       FROM hotel_images hi WHERE hi."hotelId" = h.id LIMIT 1) as images
     FROM recommendations r
     INNER JOIN hotels h ON r."hotelId" = h.id
     WHERE r."userId" = $1
     ORDER BY r.score DESC
     LIMIT 5`,
    [userId]
  );

  if (recs.length === 0) {
    recs = await generateRecommendations(userId);
  }

  return recs;
};
