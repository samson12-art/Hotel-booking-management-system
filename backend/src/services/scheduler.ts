import { getMany, query } from "../config/database";
import { sendCheckInReminderEmail } from "./email";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;

const processCheckInReminders = async () => {
  try {
    const today = new Date();
    const tomorrowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await getMany(
      `SELECT b.id, b."bookingNumber", b."checkIn", b."checkOut", b."userId",
        u.email, u."firstName",
        h.name as "hotelName"
       FROM bookings b
       INNER JOIN users u ON b."userId" = u.id
       INNER JOIN hotels h ON b."hotelId" = h.id
       WHERE b.status = 'CONFIRMED'
         AND b."checkIn" >= $1
         AND b."checkIn" < $2`,
      [tomorrowStart, tomorrowEnd]
    );

    if (bookings.length === 0) return;

    const existingReminders = await getMany(
      `SELECT "bookingId" FROM notifications
       WHERE type = 'CHECK_IN_REMINDER' AND "createdAt" >= $1`,
      [tomorrowStart]
    );
    const existingIds = new Set(existingReminders.map((r: any) => r.bookingId));

    for (const booking of bookings) {
      if (existingIds.has(booking.id)) continue;

      await query(
        `INSERT INTO notifications (id, title, message, type, "userId", "bookingId", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
        [
          "Check-in Reminder",
          `Your check-in at ${booking.hotelName} is tomorrow! Booking #${booking.bookingNumber}`,
          "CHECK_IN_REMINDER",
          booking.userId,
          booking.id,
        ]
      );

      sendCheckInReminderEmail(booking.email, booking.firstName, booking.bookingNumber, booking.hotelName, booking.checkIn);
    }

    if (bookings.length > 0) {
      console.log(`[Scheduler] Sent ${bookings.length} check-in reminder(s)`);
    }
  } catch (err) {
    console.error("[Scheduler] Error processing check-in reminders:", err);
  }
};

export const startScheduler = () => {
  if (intervalId) return;
  console.log("[Scheduler] Starting check-in reminder scheduler...");
  processCheckInReminders();
  intervalId = setInterval(processCheckInReminders, CHECK_INTERVAL_MS);
};

export const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Scheduler] Stopped.");
  }
};
