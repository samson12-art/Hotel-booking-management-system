import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { bookingSchema } from "../utils/validators";
import { sendSuccess, sendError } from "../utils/response";
import { getPaginationParams, buildPagination } from "../utils/pagination";
import { generateBookingNumber, calculateNights } from "../utils/helpers";
import { awardPoints } from "../services/loyalty";
import { sendBookingConfirmationEmail } from "../services/email";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const data = bookingSchema.parse(req.body);
    const checkInDate = new Date(data.checkIn);
    const checkOutDate = new Date(data.checkOut);

    if (checkInDate >= checkOutDate) {
      return sendError(res, "Check-out must be after check-in.", 400);
    }
    if (checkInDate < new Date()) {
      return sendError(res, "Check-in date cannot be in the past.", 400);
    }

    for (const roomId of data.roomIds) {
      const overlapping = await getOne(
        `SELECT COUNT(*) as count FROM booking_details bd
         INNER JOIN bookings b ON bd."bookingId" = b.id
         WHERE bd."roomId" = $1
           AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
           AND b."checkIn" < $3
           AND b."checkOut" > $2`,
        [roomId, checkInDate, checkOutDate]
      );
      if (parseInt(overlapping.count) > 0) {
        return sendError(res, `Room ${roomId} is not available for the selected dates.`, 400);
      }
    }

    let totalAmount = 0;
    const roomDetails: { roomId: string; price: number }[] = [];
    for (const roomId of data.roomIds) {
      const room = await getOne(`SELECT price FROM rooms WHERE id = $1`, [roomId]);
      if (!room) return sendError(res, `Room ${roomId} not found.`, 404);
      const nights = calculateNights(checkInDate, checkOutDate);
      totalAmount += room.price * nights;
      roomDetails.push({ roomId, price: room.price * nights });
    }

    let discount = 0;
    if (data.couponCode) {
      const coupon = await getOne(
        `SELECT * FROM coupons
         WHERE code = $1 AND "isActive" = true
           AND "validFrom" <= NOW() AND "validUntil" >= NOW()`,
        [data.couponCode.toUpperCase()]
      );
      if (coupon) {
        if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
          if (!coupon.minBookingAmount || totalAmount >= coupon.minBookingAmount) {
            discount = (totalAmount * coupon.discountPercent) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
            totalAmount -= discount;
            await query(`UPDATE coupons SET "usedCount" = "usedCount" + 1 WHERE id = $1`, [coupon.id]);
          }
        }
      }
    }

    const bookingNumber = generateBookingNumber();
    const booking = await getOne(
      `INSERT INTO bookings (id, "bookingNumber", "checkIn", "checkOut", guests, "specialRequests", status, "totalAmount", "userId", "hotelId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING', $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [bookingNumber, checkInDate, checkOutDate, data.guests, data.specialRequests || null, totalAmount, req.user!.id, data.hotelId]
    );

    for (const rd of roomDetails) {
      await query(
        `INSERT INTO booking_details (id, "bookingId", "roomId", price)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [booking.id, rd.roomId, rd.price]
      );
    }

    const hotel = await getOne(`SELECT name, address FROM hotels WHERE id = $1`, [data.hotelId]);
    const bookingDetails = await getMany(
      `SELECT bd.*, r."roomNumber", r.type FROM booking_details bd
       INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = $1`,
      [booking.id]
    );

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Booking Created", `Your booking ${bookingNumber} has been created. Total: $${totalAmount.toFixed(2)}`, "BOOKING_CONFIRMATION", req.user!.id]
    );

    const user = await getOne(`SELECT email, "firstName" FROM users WHERE id = $1`, [req.user!.id]);
    if (user) {
      sendBookingConfirmationEmail(user.email, user.firstName, bookingNumber, hotel.name, data.checkIn, data.checkOut, totalAmount);
    }

    awardPoints(req.user!.id, totalAmount, booking.id).catch((err) =>
      console.error("Failed to award loyalty points:", err.message)
    );

    sendSuccess(res, "Booking created successfully", { ...booking, bookingDetails, hotel }, 201);
  } catch (error: any) {
    if (error.name === "ZodError") return sendError(res, error.errors[0].message, 400);
    sendError(res, error.message, 500);
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string;

    const conditions: string[] = [`b."userId" = $1`];
    const params: any[] = [req.user!.id];
    let paramIndex = 2;
    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await getOne(`SELECT COUNT(*) as count FROM bookings b ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const bookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(h_data.*) FROM (SELECT h.id, h.name, h.address,
          (SELECT row_to_json(hi.*) FROM hotel_images hi WHERE hi."hotelId" = h.id AND hi."isPrimary" = true LIMIT 1) as "primaryImage"
         FROM hotels h WHERE h.id = b."hotelId") h_data) as hotel,
        (SELECT COALESCE(json_agg(json_build_object('roomNumber', r."roomNumber", 'type', r.type)), '[]')
         FROM booking_details bd INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = b.id) as "bookingDetails",
        (SELECT row_to_json(p_data.*) FROM (SELECT status, method FROM payments WHERE "bookingId" = b.id LIMIT 1) p_data) as payment
       FROM bookings b
       ${whereClause}
       ORDER BY b."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );
    sendSuccess(res, "Bookings retrieved", bookings, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.userId !== req.user!.id && req.user!.role === "CUSTOMER") {
      return sendError(res, "Not authorized.", 403);
    }

    const hotel = await getOne(
      `SELECT h.*,
        (SELECT COALESCE(json_agg(hi.*), '[]') FROM hotel_images hi WHERE hi."hotelId" = h.id) as images,
        (SELECT row_to_json(c.*) FROM cities c WHERE c.id = h."cityId") as city,
        (SELECT row_to_json(co.*) FROM countries co WHERE co.id = h."countryId") as country
       FROM hotels h WHERE h.id = $1`,
      [booking.hotelId]
    );
    const bookingDetails = await getMany(
      `SELECT bd.*,
        (SELECT row_to_json(r_data.*) FROM (SELECT r."roomNumber", r.type,
          (SELECT COALESCE(json_agg(ri.*), '[]') FROM room_images ri WHERE ri."roomId" = r.id) as images
         FROM rooms r WHERE r.id = bd."roomId") r_data) as room
       FROM booking_details bd WHERE bd."bookingId" = $1`,
      [booking.id]
    );
    const payment = await getOne(`SELECT * FROM payments WHERE "bookingId" = $1`, [booking.id]);
    const review = await getOne(`SELECT * FROM reviews WHERE "bookingId" = $1`, [booking.id]);
    const user = await getOne(
      `SELECT id, "firstName", "lastName", email, phone FROM users WHERE id = $1`,
      [booking.userId]
    );

    sendSuccess(res, "Booking retrieved", { ...booking, hotel, bookingDetails, payment, review, user });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }
    if (["CHECKED_OUT", "CANCELLED"].includes(booking.status)) {
      return sendError(res, "Cannot cancel this booking.", 400);
    }

    const updated = await getOne(
      `UPDATE bookings SET status = 'CANCELLED', "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    const bookingDetails = await getMany(
      `SELECT bd.*, r."roomNumber", r.type FROM booking_details bd
       INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = $1`,
      [booking.id]
    );

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Booking Cancelled", `Your booking ${booking.bookingNumber} has been cancelled.`, "BOOKING_CANCELLATION", booking.userId]
    );

    sendSuccess(res, "Booking cancelled", { ...updated, bookingDetails });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getHotelBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string;

    const conditions: string[] = [`b."hotelId" = $1`];
    const params: any[] = [req.params.hotelId];
    let paramIndex = 2;
    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const countResult = await getOne(`SELECT COUNT(*) as count FROM bookings b ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const bookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT id, "firstName", "lastName", email, phone FROM users WHERE id = b."userId") u_data) as "user",
        (SELECT COALESCE(json_agg(json_build_object('roomNumber', r."roomNumber", 'type', r.type)), '[]')
         FROM booking_details bd INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = b.id) as "bookingDetails",
        (SELECT row_to_json(p_data.*) FROM (SELECT * FROM payments WHERE "bookingId" = b.id LIMIT 1) p_data) as payment
       FROM bookings b
       ${whereClause}
       ORDER BY b."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );
    sendSuccess(res, "Bookings retrieved", bookings, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const confirmBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.status !== "PENDING") return sendError(res, "Booking is not pending.", 400);

    const updated = await getOne(
      `UPDATE bookings SET status = 'CONFIRMED', "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Booking Confirmed", `Your booking ${booking.bookingNumber} has been confirmed!`, "BOOKING_CONFIRMATION", booking.userId]
    );

    sendSuccess(res, "Booking confirmed", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const rejectBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);

    const updated = await getOne(
      `UPDATE bookings SET status = 'CANCELLED', "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await query(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
      ["Booking Rejected", `Your booking ${booking.bookingNumber} has been rejected.`, "BOOKING_CANCELLATION", booking.userId]
    );

    sendSuccess(res, "Booking rejected", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const checkInGuest = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.status !== "CONFIRMED") return sendError(res, "Booking must be confirmed first.", 400);

    const updated = await getOne(
      `UPDATE bookings SET status = 'CHECKED_IN', "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await query(
      `UPDATE rooms SET status = 'OCCUPIED', "updatedAt" = NOW()
       WHERE id IN (SELECT "roomId" FROM booking_details WHERE "bookingId" = $1)`,
      [booking.id]
    );

    sendSuccess(res, "Guest checked in", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const checkOutGuest = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.status !== "CHECKED_IN") return sendError(res, "Guest must be checked in.", 400);

    const updated = await getOne(
      `UPDATE bookings SET status = 'CHECKED_OUT', "updatedAt" = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    await query(
      `UPDATE rooms SET status = 'AVAILABLE', "updatedAt" = NOW()
       WHERE id IN (SELECT "roomId" FROM booking_details WHERE "bookingId" = $1)`,
      [booking.id]
    );

    sendSuccess(res, "Guest checked out", updated);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const downloadInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (!booking) return sendError(res, "Booking not found.", 404);
    if (booking.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      return sendError(res, "Not authorized.", 403);
    }

    const payment = await getOne(`SELECT * FROM payments WHERE "bookingId" = $1`, [booking.id]);
    const hotel = await getOne(`SELECT name, address, phoneNumber FROM hotels WHERE id = $1`, [booking.hotelId]);
    const user = await getOne(`SELECT "firstName", "lastName", email, phone FROM users WHERE id = $1`, [booking.userId]);
    const bookingDetails = await getMany(
      `SELECT bd.*, r."roomNumber", r.type FROM booking_details bd
       INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = $1`,
      [booking.id]
    );

    const doc = new jsPDF("portrait", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(22);
    doc.text("INVOICE", pageWidth / 2, 25, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Invoice #: ${payment?.invoiceNumber || booking.bookingNumber}`, 14, 40);
    doc.text(`Date: ${new Date(booking.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 47);

    doc.line(14, 52, pageWidth - 14, 52);

    doc.setFontSize(12);
    doc.text("Bill To:", 14, 62);
    doc.setFontSize(10);
    doc.text(`${user.firstName} ${user.lastName}`, 14, 70);
    doc.text(`Email: ${user.email}`, 14, 77);
    if (user.phone) doc.text(`Phone: ${user.phone}`, 14, 84);

    doc.setFontSize(12);
    doc.text("Hotel:", pageWidth / 2, 62);
    doc.setFontSize(10);
    doc.text(hotel.name, pageWidth / 2, 70);
    doc.text(hotel.address, pageWidth / 2, 77);
    if (hotel.phoneNumber) doc.text(`Phone: ${hotel.phoneNumber}`, pageWidth / 2, 84);

    doc.line(14, 92, pageWidth - 14, 92);

    (doc as any).autoTable({
      startY: 97,
      head: [["Room", "Type", "Amount"]],
      body: bookingDetails.map((bd: any) => [bd.roomNumber, bd.type, `$${parseFloat(bd.price).toFixed(2)}`]),
      foot: [["", "Total", `$${parseFloat(booking.totalAmount).toFixed(2)}`]],
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: "bold" },
    });

    const y = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(11);
    doc.text(`Booking #: ${booking.bookingNumber}`, 14, y);
    doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 14, y + 7);
    doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 14, y + 14);
    doc.text(`Status: ${booking.status.replace("_", " ")}`, 14, y + 21);
    if (payment) doc.text(`Payment: ${payment.method.replace("_", " ")} - ${payment.status}`, 14, y + 28);

    doc.setFontSize(8);
    doc.text("Thank you for choosing Hotel Booking System!", pageWidth / 2, y + 45, { align: "center" });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${booking.bookingNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(Number(req.query.page), Number(req.query.limit));
    const status = req.query.status as string;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await getOne(`SELECT COUNT(*) as count FROM bookings b ${whereClause}`, params);
    const total = parseInt(countResult.count);

    const bookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT id, "firstName", "lastName", email FROM users WHERE id = b."userId") u_data) as "user",
        (SELECT row_to_json(h_data.*) FROM (SELECT id, name FROM hotels WHERE id = b."hotelId") h_data) as hotel,
        (SELECT row_to_json(p_data.*) FROM (SELECT status, method, amount FROM payments WHERE "bookingId" = b.id LIMIT 1) p_data) as payment
       FROM bookings b
       ${whereClause}
       ORDER BY b."createdAt" DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, skip]
    );
    sendSuccess(res, "Bookings retrieved", bookings, 200, buildPagination(page, limit, total));
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
