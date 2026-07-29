import { getOne, getMany, query } from "../config/database";
import { generateBookingNumber, calculateNights, generateInvoiceNumber } from "../utils/helpers";
import { awardPoints } from "./loyalty";
import { sendBookingConfirmationEmail } from "./email";

type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED"],
  CHECKED_IN: ["CHECKED_OUT", "CANCELLED"],
  CHECKED_OUT: [],
  CANCELLED: [],
};

function assertValidTransition(current: string, next: string): void {
  if (!VALID_TRANSITIONS[current as BookingStatus]?.includes(next as BookingStatus)) {
    throw new Error(`Cannot transition booking from ${current} to ${next}`);
  }
}

export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const overlapping = await getOne(
    `SELECT COUNT(*) as count FROM booking_details bd
     INNER JOIN bookings b ON bd."bookingId" = b.id
     WHERE bd."roomId" = $1
       AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
       AND b."checkIn" < $3
       AND b."checkOut" > $2`,
    [roomId, checkIn, checkOut]
  );
  return parseInt(overlapping.count) === 0;
}

export async function validateAndApplyCoupon(
  code: string,
  totalAmount: number
): Promise<{ discount: number; amountAfterDiscount: number; applied: boolean }> {
  const coupon = await getOne(
    `SELECT * FROM coupons
     WHERE code = $1 AND "isActive" = true
       AND "validFrom" <= NOW() AND "validUntil" >= NOW()`,
    [code.toUpperCase()]
  );
  if (!coupon) return { discount: 0, amountAfterDiscount: totalAmount, applied: false };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { discount: 0, amountAfterDiscount: totalAmount, applied: false };
  if (coupon.minBookingAmount && totalAmount < coupon.minBookingAmount)
    return { discount: 0, amountAfterDiscount: totalAmount, applied: false };
  let discount = (totalAmount * coupon.discountPercent) / 100;
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  const amountAfterDiscount = totalAmount - discount;
  await query(`UPDATE coupons SET "usedCount" = "usedCount" + 1 WHERE id = $1`, [coupon.id]);
  return { discount, amountAfterDiscount, applied: true };
}

export async function createBooking(data: {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
  roomIds: string[];
  couponCode?: string;
  userId: string;
}) {
  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);

  if (checkInDate >= checkOutDate) throw new Error("Check-out must be after check-in.");
  if (checkInDate < new Date()) throw new Error("Check-in date cannot be in the past.");

  for (const roomId of data.roomIds) {
    const available = await checkRoomAvailability(roomId, checkInDate, checkOutDate);
    if (!available) throw new Error(`Room ${roomId} is not available for the selected dates.`);
  }

  let totalAmount = 0;
  const roomDetails: { roomId: string; price: number }[] = [];
  for (const roomId of data.roomIds) {
    const room = await getOne(`SELECT price FROM rooms WHERE id = $1`, [roomId]);
    if (!room) throw new Error(`Room ${roomId} not found.`);
    const nights = calculateNights(checkInDate, checkOutDate);
    totalAmount += room.price * nights;
    roomDetails.push({ roomId, price: room.price * nights });
  }

  if (data.couponCode) {
    const result = await validateAndApplyCoupon(data.couponCode, totalAmount);
    if (result.applied) totalAmount = result.amountAfterDiscount;
  }

  const bookingNumber = generateBookingNumber();
  const booking = await getOne(
    `INSERT INTO bookings (id, "bookingNumber", "checkIn", "checkOut", guests, "specialRequests", status, "totalAmount", "userId", "hotelId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING', $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [bookingNumber, checkInDate, checkOutDate, data.guests, data.specialRequests || null, totalAmount, data.userId, data.hotelId]
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

  const user = await getOne(`SELECT email, "firstName" FROM users WHERE id = $1`, [data.userId]);
  if (user) {
    sendBookingConfirmationEmail(user.email, user.firstName, bookingNumber, hotel.name, data.checkIn, data.checkOut, totalAmount);
  }

  awardPoints(data.userId, totalAmount, booking.id).catch((err) =>
    console.error("Failed to award loyalty points:", err.message)
  );

  return { ...booking, bookingDetails, hotel };
}

export async function transitionBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  extraUpdates?: Record<string, any>
): Promise<any> {
  const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!booking) throw new Error("Booking not found.");
  assertValidTransition(booking.status, newStatus);

  const setClauses = [`status = '${newStatus}'`, `"updatedAt" = NOW()`];
  const params: any[] = [bookingId];
  if (extraUpdates) {
    let idx = 2;
    for (const [key, value] of Object.entries(extraUpdates)) {
      setClauses.push(`"${key}" = $${idx++}`);
      params.push(value);
    }
  }

  return await getOne(
    `UPDATE bookings SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
    params
  );
}

export async function cancelBooking(bookingId: string, userId: string, role: string): Promise<any> {
  const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!booking) throw new Error("Booking not found.");
  if (booking.userId !== userId && role !== "ADMIN") throw new Error("Not authorized.");
  assertValidTransition(booking.status, "CANCELLED");

  const updated = await transitionBookingStatus(bookingId, "CANCELLED");

  const bookingDetails = await getMany(
    `SELECT bd.*, r."roomNumber", r.type FROM booking_details bd
     INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = $1`,
    [bookingId]
  );

  await query(
    `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
    ["Booking Cancelled", `Your booking ${booking.bookingNumber} has been cancelled.`, "BOOKING_CANCELLATION", booking.userId]
  );

  return { ...updated, bookingDetails };
}

export async function confirmBooking(bookingId: string): Promise<any> {
  const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!booking) throw new Error("Booking not found.");
  assertValidTransition(booking.status, "CONFIRMED");

  const updated = await transitionBookingStatus(bookingId, "CONFIRMED");

  await query(
    `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
    ["Booking Confirmed", `Your booking ${booking.bookingNumber} has been confirmed!`, "BOOKING_CONFIRMATION", booking.userId]
  );

  return updated;
}

export async function rejectBooking(bookingId: string): Promise<any> {
  const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!booking) throw new Error("Booking not found.");

  const updated = await transitionBookingStatus(bookingId, "CANCELLED");

  await query(
    `INSERT INTO notifications (id, title, message, type, "userId", "createdAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())`,
    ["Booking Rejected", `Your booking ${booking.bookingNumber} has been rejected.`, "BOOKING_CANCELLATION", booking.userId]
  );

  return updated;
}

export async function checkInGuest(bookingId: string): Promise<any> {
  const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!booking) throw new Error("Booking not found.");
  assertValidTransition(booking.status, "CHECKED_IN");

  const updated = await transitionBookingStatus(bookingId, "CHECKED_IN");

  await query(
    `UPDATE rooms SET status = 'OCCUPIED', "updatedAt" = NOW()
     WHERE id IN (SELECT "roomId" FROM booking_details WHERE "bookingId" = $1)`,
    [bookingId]
  );

  return updated;
}

export async function checkOutGuest(bookingId: string): Promise<any> {
  const booking = await getOne(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
  if (!booking) throw new Error("Booking not found.");
  assertValidTransition(booking.status, "CHECKED_OUT");

  const updated = await transitionBookingStatus(bookingId, "CHECKED_OUT");

  await query(
    `UPDATE rooms SET status = 'AVAILABLE', "updatedAt" = NOW()
     WHERE id IN (SELECT "roomId" FROM booking_details WHERE "bookingId" = $1)`,
    [bookingId]
  );

  return updated;
}
