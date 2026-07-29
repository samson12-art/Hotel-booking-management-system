import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const q = async (text: string, params?: any[]) => {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
};

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("Password123", 12);
  const u = () => uuidv4();

  const admin = await q(
    `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isVerified", phone, "createdAt", "updatedAt")
     VALUES ($1, 'admin@xyhotel.com', $2, 'Abebe', 'Kebede', 'ADMIN', true, '+251-91-123-4567', NOW(), NOW()) RETURNING id`,
    [u(), hashedPassword]
  );

  const manager = await q(
    `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isVerified", phone, "createdAt", "updatedAt")
     VALUES ($1, 'manager@xyhotel.com', $2, 'Fatuma', 'Ahmed', 'HOTEL_MANAGER', true, '+251-92-234-5678', NOW(), NOW()) RETURNING id`,
    [u(), hashedPassword]
  );

  const customer1 = await q(
    `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isVerified", phone, "createdAt", "updatedAt")
     VALUES ($1, 'guest@xyhotel.com', $2, 'Daniel', 'Tadesse', 'CUSTOMER', true, '+251-93-345-6789', NOW(), NOW()) RETURNING id`,
    [u(), hashedPassword]
  );

  const customer2 = await q(
    `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isVerified", phone, "createdAt", "updatedAt")
     VALUES ($1, 'sara@xyhotel.com', $2, 'Sara', 'Getachew', 'CUSTOMER', true, '+251-94-456-7890', NOW(), NOW()) RETURNING id`,
    [u(), hashedPassword]
  );

  const staff = await q(
    `INSERT INTO users (id, email, password, "firstName", "lastName", role, "isVerified", phone, "createdAt", "updatedAt")
     VALUES ($1, 'staff@xyhotel.com', $2, 'Yonas', 'Bekele', 'STAFF', true, '+251-95-567-8901', NOW(), NOW()) RETURNING id`,
    [u(), hashedPassword]
  );

  console.log("Users created");

  const eth = await q(`INSERT INTO countries (id, name, code) VALUES ($1, 'Ethiopia', 'ET') RETURNING id`, [u()]);
  const addis = await q(`INSERT INTO cities (id, name, "countryId") VALUES ($1, 'Addis Ababa', $2) RETURNING id`, [u(), eth.id]);

  console.log("Country & city created");

  const amenityData = [
    { name: "Free WiFi", icon: "wifi" },
    { name: "Swimming Pool", icon: "pool" },
    { name: "Gym & Fitness Center", icon: "gym" },
    { name: "Spa & Wellness", icon: "spa" },
    { name: "Free Parking", icon: "parking" },
    { name: "Restaurant & Bar", icon: "restaurant" },
    { name: "Breakfast Included", icon: "breakfast" },
    { name: "Airport Shuttle", icon: "shuttle" },
    { name: "24/7 Room Service", icon: "roomservice" },
    { name: "Air Conditioning", icon: "ac" },
    { name: "Conference Rooms", icon: "conference" },
    { name: "Laundry Service", icon: "laundry" },
  ];

  const amenityIds: string[] = [];
  for (const a of amenityData) {
    const r = await q(`INSERT INTO amenities (id, name, icon) VALUES ($1, $2, $3) RETURNING id`, [u(), a.name, a.icon]);
    amenityIds.push(r.id);
  }

  console.log("Amenities created");

  const hotel = await q(
    `INSERT INTO hotels (id, name, description, address, "cityId", "countryId", "starRating", "phoneNumber", email, website, latitude, longitude, "managerId", "isActive", "createdAt", "updatedAt")
     VALUES ($1, 'XY Hotel', 'A premier luxury hotel in the heart of Addis Ababa, offering world-class hospitality with a blend of Ethiopian warmth and international standards. Enjoy stunning views of the Entoto Mountains, exquisite dining experiences, and impeccable service.', 'Bole Road, Addis Ababa, Ethiopia', $2, $3, 5, '+251-11-661-8888', 'info@xyhotel.com', 'https://xyhotel.com', 9.0192, 38.7525, $4, true, NOW(), NOW()) RETURNING id`,
    [u(), addis.id, eth.id, manager.id]
  );

  console.log("XY Hotel created");

  const hotelImages = [
    { url: "/uploads/hotels/xy-hero.jpg", hotelId: hotel.id, isPrimary: true, alt: "XY Hotel Exterior" },
    { url: "/uploads/hotels/xy-lobby.jpg", hotelId: hotel.id, isPrimary: false, alt: "XY Hotel Lobby" },
    { url: "/uploads/hotels/xy-restaurant.jpg", hotelId: hotel.id, isPrimary: false, alt: "XY Hotel Restaurant" },
    { url: "/uploads/hotels/xy-pool.jpg", hotelId: hotel.id, isPrimary: false, alt: "XY Hotel Pool" },
    { url: "/uploads/hotels/xy-spa.jpg", hotelId: hotel.id, isPrimary: false, alt: "XY Hotel Spa" },
    { url: "/uploads/hotels/xy-view.jpg", hotelId: hotel.id, isPrimary: false, alt: "Entoto Mountain View" },
  ];
  for (const img of hotelImages) {
    await q(
      `INSERT INTO hotel_images (id, url, "hotelId", "isPrimary", alt) VALUES ($1, $2, $3, $4, $5)`,
      [u(), img.url, img.hotelId, img.isPrimary, img.alt]
    );
  }

  const hotelAmenityIndices = [0,1,2,3,4,5,6,7,8,9,10,11];
  for (const idx of hotelAmenityIndices) {
    await q(
      `INSERT INTO hotel_amenities (id, "hotelId", "amenityId") VALUES ($1, $2, $3)`,
      [u(), hotel.id, amenityIds[idx]]
    );
  }

  console.log("Hotel amenities created");

  const policies = [
    { title: "Check-in / Check-out", description: "Check-in: 2:00 PM onwards. Check-out: by 12:00 PM. Early check-in and late check-out available upon request (subject to availability)." },
    { title: "Cancellation Policy", description: "Free cancellation up to 48 hours before check-in. Cancellations within 48 hours will be charged one night's stay." },
    { title: "ID Requirement", description: "Valid government-issued ID or passport required at check-in for all guests." },
    { title: "Children & Extra Beds", description: "Children under 12 stay free when using existing beds. Extra beds available upon request at $30/night." },
    { title: "Payment Methods", description: "We accept TeleBirr, CBE Birr, credit/debit cards, and cash (ETB)." },
  ];
  for (const p of policies) {
    await q(
      `INSERT INTO hotel_policies (id, title, description, "hotelId") VALUES ($1, $2, $3, $4)`,
      [u(), p.title, p.description, hotel.id]
    );
  }

  const roomData: any[] = [];

  // Standard Rooms (Floor 1)
  const standardRooms = [
    { roomNumber: "101", capacity: 2, beds: 1, price: 85.00, description: "Comfortable standard room with city view" },
    { roomNumber: "102", capacity: 2, beds: 1, price: 85.00, description: "Cozy standard room with garden view" },
    { roomNumber: "103", capacity: 2, beds: 1, price: 85.00, description: "Standard room with modern amenities" },
    { roomNumber: "104", capacity: 2, beds: 2, price: 95.00, description: "Standard twin room" },
    { roomNumber: "105", capacity: 2, beds: 1, price: 85.00, description: "Standard room, quiet corner" },
  ];
  for (const r of standardRooms) {
    roomData.push({ hotelId: hotel.id, type: "STANDARD", ...r });
  }

  // Deluxe Rooms (Floor 2)
  const deluxeRooms = [
    { roomNumber: "201", capacity: 2, beds: 1, price: 140.00, description: "Deluxe room with panoramic city view" },
    { roomNumber: "202", capacity: 2, beds: 1, price: 140.00, description: "Deluxe room with workspace" },
    { roomNumber: "203", capacity: 3, beds: 2, price: 160.00, description: "Deluxe triple room" },
    { roomNumber: "204", capacity: 2, beds: 1, price: 140.00, description: "Deluxe room with balcony" },
    { roomNumber: "205", capacity: 2, beds: 1, price: 140.00, description: "Deluxe mountain view" },
  ];
  for (const r of deluxeRooms) {
    roomData.push({ hotelId: hotel.id, type: "DELUXE", ...r });
  }

  // Suites (Floor 3)
  const suiteRooms = [
    { roomNumber: "301", capacity: 3, beds: 2, price: 250.00, description: "Junior suite with living area and mountain view" },
    { roomNumber: "302", capacity: 3, beds: 2, price: 250.00, description: "Junior suite with separate seating" },
    { roomNumber: "303", capacity: 4, beds: 2, price: 350.00, description: "Executive suite with panoramic views" },
    { roomNumber: "304", capacity: 2, beds: 1, price: 300.00, description: "Honeymoon suite with private terrace" },
  ];
  for (const r of suiteRooms) {
    roomData.push({ hotelId: hotel.id, type: "SUITE", ...r });
  }

  // Family Rooms (Floor 4)
  const familyRooms = [
    { roomNumber: "401", capacity: 5, beds: 3, price: 200.00, description: "Family room with connecting beds" },
    { roomNumber: "402", capacity: 6, beds: 3, price: 230.00, description: "Large family room with living space" },
    { roomNumber: "403", capacity: 4, beds: 2, price: 200.00, description: "Family suite with kitchenette" },
  ];
  for (const r of familyRooms) {
    roomData.push({ hotelId: hotel.id, type: "FAMILY", ...r });
  }

  // Executive Rooms (Floor 5)
  const executiveRooms = [
    { roomNumber: "501", capacity: 2, beds: 1, price: 400.00, description: "Executive room with office space and premium amenities" },
    { roomNumber: "502", capacity: 2, beds: 1, price: 450.00, description: "Executive suite with butler service" },
  ];
  for (const r of executiveRooms) {
    roomData.push({ hotelId: hotel.id, type: "EXECUTIVE", ...r });
  }

  const roomIds: string[] = [];
  for (const r of roomData) {
    const id = u();
    roomIds.push(id);
    await q(
      `INSERT INTO rooms (id, "roomNumber", type, description, capacity, beds, bathroom, price, status, "hotelId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'Private', $7, 'AVAILABLE', $8, NOW(), NOW())`,
      [id, r.roomNumber, r.type, r.description, r.capacity, r.beds, r.price, r.hotelId]
    );
  }

  console.log("Rooms created (19 rooms across 5 types)");

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const pastCheckIn = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const pastCheckOut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const b1Id = u();
  await q(
    `INSERT INTO bookings (id, "bookingNumber", "checkIn", "checkOut", guests, "specialRequests", status, "totalAmount", "userId", "hotelId", "createdAt", "updatedAt")
     VALUES ($1, 'XYH-0001', $2, $3, 2, 'Late check-in please, arriving around 10 PM', 'CONFIRMED', 1750.00, $4, $5, NOW(), NOW())`,
    [b1Id, nextWeek, twoWeeks, customer1.id, hotel.id]
  );
  await q(`INSERT INTO booking_details (id, "bookingId", "roomId", price) VALUES ($1, $2, $3, 1750.00)`, [u(), b1Id, roomIds[10]]);

  const b2Id = u();
  await q(
    `INSERT INTO bookings (id, "bookingNumber", "checkIn", "checkOut", guests, status, "totalAmount", "userId", "hotelId", "createdAt", "updatedAt")
     VALUES ($1, 'XYH-0002', $2, $3, 1, 'CHECKED_OUT', 425.00, $4, $5, NOW(), NOW())`,
    [b2Id, pastCheckIn, pastCheckOut, customer1.id, hotel.id]
  );
  await q(`INSERT INTO booking_details (id, "bookingId", "roomId", price) VALUES ($1, $2, $3, 425.00)`, [u(), b2Id, roomIds[0]]);

  const b3Id = u();
  await q(
    `INSERT INTO bookings (id, "bookingNumber", "checkIn", "checkOut", guests, "specialRequests", status, "totalAmount", "userId", "hotelId", "createdAt", "updatedAt")
     VALUES ($1, 'XYH-0003', $2, $3, 2, 'Quiet room preferred', 'PENDING', 280.00, $4, $5, NOW(), NOW())`,
    [b3Id, nextWeek, twoWeeks, customer2.id, hotel.id]
  );
  await q(`INSERT INTO booking_details (id, "bookingId", "roomId", price) VALUES ($1, $2, $3, 280.00)`, [u(), b3Id, roomIds[5]]);

  const b4Id = u();
  await q(
    `INSERT INTO bookings (id, "bookingNumber", "checkIn", "checkOut", guests, status, "totalAmount", "userId", "hotelId", "createdAt", "updatedAt")
     VALUES ($1, 'XYH-0004', $2, $3, 4, 'CHECKED_OUT', 460.00, $4, $5, NOW(), NOW())`,
    [b4Id, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000), customer2.id, hotel.id]
  );
  await q(`INSERT INTO booking_details (id, "bookingId", "roomId", price) VALUES ($1, $2, $3, 460.00)`, [u(), b4Id, roomIds[14]]);

  console.log("Bookings created");

  await q(
    `INSERT INTO payments (id, amount, method, status, "transactionId", "invoiceNumber", "bookingId", "userId", "createdAt", "updatedAt")
     VALUES ($1, 1750.00, 'TELEBIRR', 'COMPLETED', 'TXN-XYH-001', 'INV-XYH-001', $2, $3, NOW(), NOW())`,
    [u(), b1Id, customer1.id]
  );

  await q(
    `INSERT INTO payments (id, amount, method, status, "transactionId", "invoiceNumber", "bookingId", "userId", "createdAt", "updatedAt")
     VALUES ($1, 425.00, 'CBE_BIRR', 'COMPLETED', 'TXN-XYH-002', 'INV-XYH-002', $2, $3, NOW(), NOW())`,
    [u(), b2Id, customer1.id]
  );

  await q(
    `INSERT INTO payments (id, amount, method, status, "transactionId", "invoiceNumber", "bookingId", "userId", "createdAt", "updatedAt")
     VALUES ($1, 460.00, 'CREDIT_CARD', 'COMPLETED', 'TXN-XYH-003', 'INV-XYH-003', $2, $3, NOW(), NOW())`,
    [u(), b4Id, customer2.id]
  );

  console.log("Payments created");

  await q(
    `INSERT INTO reviews (id, rating, comment, photos, "userId", "hotelId", "bookingId", "createdAt", "updatedAt")
     VALUES ($1, 5, 'Absolutely wonderful stay! The staff was incredibly welcoming, the room was spotless, and the view of Entoto Mountains from my suite was breathtaking. The breakfast buffet had an amazing selection of Ethiopian and international cuisine.', '{}', $2, $3, $4, NOW(), NOW())`,
    [u(), customer1.id, hotel.id, b2Id]
  );

  await q(
    `INSERT INTO reviews (id, rating, comment, photos, "userId", "hotelId", "bookingId", "createdAt", "updatedAt")
     VALUES ($1, 4, 'Great hotel in Addis Ababa. The location is perfect for both business and leisure. The spa was relaxing and the restaurant serves excellent food. Will definitely come back!', '{}', $2, $3, $4, NOW(), NOW())`,
    [u(), customer2.id, hotel.id, b4Id]
  );

  console.log("Reviews created");

  const coupons = [
    { code: "WELCOME10", description: "10% off for first-time guests", discountPercent: 10, maxDiscount: 50, usageLimit: 100, validDays: 90 },
    { code: "XYHOTEL20", description: "20% off extended stays (3+ nights)", discountPercent: 20, maxDiscount: 100, minBookingAmount: 200, usageLimit: 50, validDays: 60 },
    { code: "VIP30", description: "30% VIP discount for suites", discountPercent: 30, maxDiscount: 200, minBookingAmount: 500, validDays: 365 },
  ];

  for (const c of coupons) {
    const validUntil = new Date(now.getTime() + c.validDays * 24 * 60 * 60 * 1000);
    await q(
      `INSERT INTO coupons (id, code, description, "discountPercent", "maxDiscount", "minBookingAmount", "validFrom", "validUntil", "isActive", "usageLimit", "usedCount", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, true, $8, 0, NOW())`,
      [u(), c.code, c.description, c.discountPercent, c.maxDiscount, c.minBookingAmount || null, validUntil, c.usageLimit || null]
    );
  }

  console.log("Coupons created");

  const notifications = [
    { userId: customer1.id, title: "Welcome to XY Hotel!", message: "Thank you for registering. Explore our rooms and book your perfect stay.", type: "REGISTRATION" },
    { userId: customer1.id, title: "Booking Confirmed", message: "Your booking XYH-0001 has been confirmed. We look forward to welcoming you!", type: "BOOKING_CONFIRMATION" },
    { userId: customer2.id, title: "Welcome to XY Hotel!", message: "Thank you for registering. Explore our rooms and book your perfect stay.", type: "REGISTRATION" },
  ];
  for (const n of notifications) {
    await q(
      `INSERT INTO notifications (id, title, message, type, "userId", "createdAt") VALUES ($1, $2, $3, $4, $5, NOW())`,
      [u(), n.title, n.message, n.type, n.userId]
    );
  }

  console.log("Notifications created");
  console.log("\n=== Seed completed successfully! ===");
  console.log("\nXY Hotel Test Accounts:");
  console.log("Admin:    admin@xyhotel.com / Password123");
  console.log("Manager:  manager@xyhotel.com / Password123");
  console.log("Guest:    guest@xyhotel.com / Password123");
  console.log("Guest 2:  sara@xyhotel.com / Password123");

  await pool.end();
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
