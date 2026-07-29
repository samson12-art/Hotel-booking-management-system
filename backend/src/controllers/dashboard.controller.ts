import { Response } from "express";
import { getOne, getMany } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalHotels = await getOne(`SELECT COUNT(*) as count FROM hotels WHERE "isActive" = true`, []);
    const totalRooms = await getOne(`SELECT COUNT(*) as count FROM rooms`, []);
    const activeBookings = await getOne(
      `SELECT COUNT(*) as count FROM bookings WHERE status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')`, []
    );
    const totalCustomers = await getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'`, []);

    const monthlyRevenue = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'COMPLETED' AND "createdAt" >= $1`,
      [startOfMonth]
    );
    const lastMonthRevenue = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'COMPLETED' AND "createdAt" >= $1 AND "createdAt" <= $2`,
      [startOfLastMonth, endOfLastMonth]
    );

    const roomStatusCounts = await getMany(
      `SELECT status, COUNT(*) as count FROM rooms GROUP BY status`, []
    );
    const bookingTrends = await getMany(
      `SELECT status, COUNT(*) as count FROM bookings GROUP BY status`, []
    );

    const recentBookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName" FROM users WHERE id = b."userId") u_data) as "user",
        (SELECT row_to_json(h_data.*) FROM (SELECT name FROM hotels WHERE id = b."hotelId") h_data) as hotel
       FROM bookings b ORDER BY b."createdAt" DESC LIMIT 10`,
      []
    );

    const mostBookedHotels = await getMany(
      `SELECT h.*, COUNT(b.id) as "bookingCount"
       FROM hotels h
       LEFT JOIN bookings b ON h.id = b."hotelId"
       GROUP BY h.id
       ORDER BY "bookingCount" DESC LIMIT 5`,
      []
    );

    const paymentMethodCounts = await getMany(
      `SELECT method, COUNT(*) as count, COALESCE(SUM(amount), 0) as "totalAmount"
       FROM payments WHERE status = 'COMPLETED'
       GROUP BY method`,
      []
    );

    const totalRoomsVal = parseInt(totalRooms.count);
    const occupiedEntry = roomStatusCounts.find((s: any) => s.status === "OCCUPIED");
    const occupiedRooms = occupiedEntry ? parseInt(occupiedEntry.count) : 0;
    const occupancyRate = totalRoomsVal > 0 ? Math.round((occupiedRooms / totalRoomsVal) * 100) : 0;

    const currentRevenue = parseFloat(monthlyRevenue.total) || 0;
    const previousRevenue = parseFloat(lastMonthRevenue.total) || 0;
    const revenueGrowth = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100) : 0;

    sendSuccess(res, "Admin dashboard data", {
      totalHotels: parseInt(totalHotels.count),
      totalRooms: totalRoomsVal,
      activeBookings: parseInt(activeBookings.count),
      totalCustomers: parseInt(totalCustomers.count),
      monthlyRevenue: currentRevenue,
      lastMonthRevenue: previousRevenue,
      revenueGrowth,
      occupancyRate,
      roomStatusBreakdown: roomStatusCounts.map((s: any) => ({ status: s.status, count: parseInt(s.count) })),
      bookingStatusBreakdown: bookingTrends.map((s: any) => ({ status: s.status, count: parseInt(s.count) })),
      recentBookings,
      mostBookedHotels,
      paymentMethodBreakdown: paymentMethodCounts.map((p: any) => ({
        method: p.method, count: parseInt(p.count), totalAmount: parseFloat(p.totalAmount) || 0,
      })),
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getCustomerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const upcomingBookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(h_data.*) FROM (
          SELECT name, address,
            (SELECT row_to_json(hi.*) FROM hotel_images hi WHERE hi."hotelId" = h.id AND hi."isPrimary" = true LIMIT 1) as "primaryImage"
          FROM hotels h WHERE h.id = b."hotelId"
        ) h_data) as hotel,
        (SELECT row_to_json(p_data.*) FROM (SELECT status FROM payments WHERE "bookingId" = b.id LIMIT 1) p_data) as payment
       FROM bookings b
       WHERE b."userId" = $1 AND b.status IN ('PENDING', 'CONFIRMED') AND b."checkIn" >= NOW()
       ORDER BY b."checkIn" ASC LIMIT 5`,
      [userId]
    );

    const pastBookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(h_data.*) FROM (
          SELECT name, address,
            (SELECT row_to_json(hi.*) FROM hotel_images hi WHERE hi."hotelId" = h.id AND hi."isPrimary" = true LIMIT 1) as "primaryImage"
          FROM hotels h WHERE h.id = b."hotelId"
        ) h_data) as hotel
       FROM bookings b
       WHERE b."userId" = $1 AND b.status IN ('CHECKED_OUT', 'CANCELLED')
       ORDER BY b."createdAt" DESC LIMIT 5`,
      [userId]
    );

    const savedHotels = await getMany(
      `SELECT f.*,
        (SELECT row_to_json(h_data.*) FROM (
          SELECT h.*,
            (SELECT row_to_json(hi.*) FROM hotel_images hi WHERE hi."hotelId" = h.id AND hi."isPrimary" = true LIMIT 1) as "primaryImage",
            (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r."hotelId" = h.id) as "averageRating"
          FROM hotels h WHERE h.id = f."hotelId"
        ) h_data) as hotel
       FROM favorites f WHERE f."userId" = $1 LIMIT 5`,
      [userId]
    );

    const totalSpent = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE "userId" = $1 AND status = 'COMPLETED'`,
      [userId]
    );

    const recentReviews = await getMany(
      `SELECT rv.*,
        (SELECT row_to_json(h_data.*) FROM (SELECT name FROM hotels WHERE id = rv."hotelId") h_data) as hotel
       FROM reviews rv
       WHERE rv."userId" = $1
       ORDER BY rv."createdAt" DESC LIMIT 5`,
      [userId]
    );

    sendSuccess(res, "Customer dashboard", {
      upcomingBookings,
      pastBookings,
      savedHotels,
      totalSpent: parseFloat(totalSpent.total) || 0,
      recentReviews,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getManagerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const managerId = req.user!.id;

    const myHotels = await getMany(
      `SELECT h.*,
        (SELECT COUNT(*) FROM rooms r WHERE r."hotelId" = h.id) as "roomCount",
        (SELECT COUNT(*) FROM bookings b WHERE b."hotelId" = h.id) as "bookingCount",
        (SELECT COUNT(*) FROM reviews rv WHERE rv."hotelId" = h.id) as "reviewCount"
       FROM hotels h WHERE h."managerId" = $1`,
      [managerId]
    );

    const totalRooms = await getOne(
      `SELECT COUNT(*) as count FROM rooms r
       INNER JOIN hotels h ON r."hotelId" = h.id
       WHERE h."managerId" = $1`,
      [managerId]
    );

    const pendingBookings = await getOne(
      `SELECT COUNT(*) as count FROM bookings b
       INNER JOIN hotels h ON b."hotelId" = h.id
       WHERE h."managerId" = $1 AND b.status = 'PENDING'`,
      [managerId]
    );

    const totalRevenue = await getOne(
      `SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
       INNER JOIN bookings b ON p."bookingId" = b.id
       INNER JOIN hotels h ON b."hotelId" = h.id
       WHERE p.status = 'COMPLETED' AND h."managerId" = $1`,
      [managerId]
    );

    const recentBookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName" FROM users WHERE id = b."userId") u_data) as "user",
        (SELECT COALESCE(json_agg(json_build_object('roomNumber', r."roomNumber", 'type', r.type)), '[]')
         FROM booking_details bd INNER JOIN rooms r ON bd."roomId" = r.id WHERE bd."bookingId" = b.id) as "bookingDetails"
       FROM bookings b
       INNER JOIN hotels h ON b."hotelId" = h.id
       WHERE h."managerId" = $1
       ORDER BY b."createdAt" DESC LIMIT 10`,
      [managerId]
    );

    const roomStatusCounts = await getMany(
      `SELECT r.status, COUNT(*) as count
       FROM rooms r
       INNER JOIN hotels h ON r."hotelId" = h.id
       WHERE h."managerId" = $1
       GROUP BY r.status`,
      [managerId]
    );

    sendSuccess(res, "Manager dashboard", {
      myHotels,
      totalRooms: parseInt(totalRooms.count),
      pendingBookings: parseInt(pendingBookings.count),
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      recentBookings,
      roomStatusBreakdown: roomStatusCounts.map((s: any) => ({ status: s.status, count: parseInt(s.count) })),
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
