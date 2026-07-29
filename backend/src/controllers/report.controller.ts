import { Response } from "express";
import { getOne, getMany, query } from "../config/database";
import { AuthRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";
import { exportToExcel, exportToPdf } from "../utils/export";

export const getBookingReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, hotelId } = req.query as any;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      conditions.push(`b."createdAt" >= $${paramIndex++} AND b."createdAt" <= $${paramIndex++}`);
      params.push(new Date(startDate), new Date(endDate));
    }
    if (hotelId) {
      conditions.push(`b."hotelId" = $${paramIndex++}`);
      params.push(hotelId);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const bookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName" FROM users WHERE id = b."userId") u_data) as "user",
        (SELECT row_to_json(h_data.*) FROM (SELECT name FROM hotels WHERE id = b."hotelId") h_data) as hotel
       FROM bookings b ${whereClause} ORDER BY b."createdAt" DESC`,
      params
    );

    const statusCounts = await getMany(
      `SELECT status, COUNT(*) as count, COALESCE(SUM("totalAmount"), 0) as "totalAmount"
       FROM bookings b ${whereClause} GROUP BY status`,
      params
    );

    const totalRevenue = await getOne(
      `SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
       INNER JOIN bookings b ON p."bookingId" = b.id
       ${whereClause.replace(/b\./g, "b.")} ${whereClause ? "AND" : "WHERE"} p.status = 'COMPLETED'`,
      params
    );

    sendSuccess(res, "Booking report", {
      totalBookings: bookings.length,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      statusBreakdown: statusCounts.map((s: any) => ({ status: s.status, count: parseInt(s.count), totalAmount: parseFloat(s.totalAmount) || 0 })),
      bookings,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getRevenueReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, hotelId } = req.query as any;
    const conditions: string[] = [`p.status = 'COMPLETED'`];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      conditions.push(`p."createdAt" >= $${paramIndex++} AND p."createdAt" <= $${paramIndex++}`);
      params.push(new Date(startDate), new Date(endDate));
    }
    if (hotelId) {
      conditions.push(`p."bookingId" IN (SELECT id FROM bookings WHERE "hotelId" = $${paramIndex++})`);
      params.push(hotelId);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const totalRevenue = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments p ${whereClause}`,
      params
    );

    const methodBreakdown = await getMany(
      `SELECT method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
       FROM payments p ${whereClause} GROUP BY method`,
      params
    );

    const monthlyTrend = await getMany(
      `SELECT amount, "createdAt" FROM payments p ${whereClause} ORDER BY "createdAt" ASC`,
      params
    );

    const monthlyData: Record<string, number> = {};
    monthlyTrend.forEach((p: any) => {
      const month = new Date(p.createdAt).toISOString().slice(0, 7);
      monthlyData[month] = (monthlyData[month] || 0) + parseFloat(p.amount);
    });

    sendSuccess(res, "Revenue report", {
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      totalTransactions: parseInt(totalRevenue.count),
      methodBreakdown: methodBreakdown.map((m: any) => ({ method: m.method, count: parseInt(m.count), total: parseFloat(m.total) || 0 })),
      monthlyTrend: Object.entries(monthlyData).map(([month, amount]) => ({ month, amount })),
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getOccupancyReport = async (req: AuthRequest, res: Response) => {
  try {
    const { hotelId } = req.query as any;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (hotelId) {
      conditions.push(`r."hotelId" = $${paramIndex++}`);
      params.push(hotelId);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const roomStatusCounts = await getMany(
      `SELECT status, COUNT(*) as count FROM rooms r ${whereClause} GROUP BY status`,
      params
    );
    const totalRooms = await getOne(
      `SELECT COUNT(*) as count FROM rooms r ${whereClause}`,
      params
    );

    const occupiedRooms = roomStatusCounts.find((s: any) => s.status === "OCCUPIED");
    const reservedRooms = roomStatusCounts.find((s: any) => s.status === "RESERVED");
    const availableRooms = roomStatusCounts.find((s: any) => s.status === "AVAILABLE");
    const totalRoomsVal = parseInt(totalRooms.count);
    const occupiedVal = occupiedRooms ? parseInt(occupiedRooms.count) : 0;

    const bookingConditions: string[] = [`b.status IN ('CHECKED_IN', 'CONFIRMED')`];
    const bookingParams: any[] = [];
    let bookingParamIndex = 1;
    if (hotelId) {
      bookingConditions.push(`b."hotelId" = $${bookingParamIndex++}`);
      bookingParams.push(hotelId);
    }
    const activeBookings = await getOne(
      `SELECT COUNT(*) as count FROM bookings b WHERE ${bookingConditions.join(" AND ")}`,
      bookingParams
    );

    sendSuccess(res, "Occupancy report", {
      totalRooms: totalRoomsVal,
      occupiedRooms: occupiedVal,
      reservedRooms: reservedRooms ? parseInt(reservedRooms.count) : 0,
      availableRooms: availableRooms ? parseInt(availableRooms.count) : 0,
      occupancyRate: totalRoomsVal > 0 ? Math.round((occupiedVal / totalRoomsVal) * 100) : 0,
      activeBookings: parseInt(activeBookings.count),
      statusBreakdown: roomStatusCounts.map((s: any) => ({ status: s.status, count: parseInt(s.count) })),
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getCustomerReport = async (req: AuthRequest, res: Response) => {
  try {
    const totalCustomers = await getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER'`, []);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newCustomersThisMonth = await getOne(
      `SELECT COUNT(*) as count FROM users WHERE role = 'CUSTOMER' AND "createdAt" >= $1`,
      [startOfMonth]
    );

    const topCustomers = await getMany(
      `SELECT u.id, u."firstName", u."lastName", u.email,
        COUNT(b.id) as "bookingCount",
        COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.amount ELSE 0 END), 0) as "totalSpent"
       FROM users u
       LEFT JOIN bookings b ON u.id = b."userId"
       LEFT JOIN payments p ON b.id = p."bookingId"
       WHERE u.role = 'CUSTOMER'
       GROUP BY u.id
       ORDER BY "bookingCount" DESC
       LIMIT 10`,
      []
    );

    sendSuccess(res, "Customer report", {
      totalCustomers: parseInt(totalCustomers.count),
      newCustomersThisMonth: parseInt(newCustomersThisMonth.count),
      topCustomers: topCustomers.map((c: any) => ({
        ...c,
        bookingCount: parseInt(c.bookingCount),
        totalSpent: parseFloat(c.totalSpent) || 0,
      })),
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const getCancellationReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const conditions: string[] = [`b.status = 'CANCELLED'`];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      conditions.push(`b."createdAt" >= $${paramIndex++} AND b."createdAt" <= $${paramIndex++}`);
      params.push(new Date(startDate), new Date(endDate));
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const cancelledBookings = await getMany(
      `SELECT b.*,
        (SELECT row_to_json(u_data.*) FROM (SELECT "firstName", "lastName" FROM users WHERE id = b."userId") u_data) as "user",
        (SELECT row_to_json(h_data.*) FROM (SELECT name FROM hotels WHERE id = b."hotelId") h_data) as hotel
       FROM bookings b ${whereClause} ORDER BY b."createdAt" DESC`,
      params
    );

    const totalCancelled = await getOne(`SELECT COUNT(*) as count FROM bookings b ${whereClause}`, params);
    const cancelledRevenue = await getOne(`SELECT COALESCE(SUM("totalAmount"), 0) as total FROM bookings b ${whereClause}`, params);
    const totalAllBookings = await getOne(`SELECT COUNT(*) as count FROM bookings`, []);

    const totalAll = parseInt(totalAllBookings.count);
    const totalCancelledVal = parseInt(totalCancelled.count);

    sendSuccess(res, "Cancellation report", {
      totalCancelled: totalCancelledVal,
      cancellationRate: totalAll > 0 ? Math.round((totalCancelledVal / totalAll) * 100) : 0,
      lostRevenue: parseFloat(cancelledRevenue.total) || 0,
      cancelledBookings,
    });
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const exportBookingReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, hotelId, format } = req.query as any;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      conditions.push(`b."createdAt" >= $${paramIndex++} AND b."createdAt" <= $${paramIndex++}`);
      params.push(new Date(startDate), new Date(endDate));
    }
    if (hotelId) {
      conditions.push(`b."hotelId" = $${paramIndex++}`);
      params.push(hotelId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const bookings = await getMany(
      `SELECT b."bookingNumber", b.status, b."totalAmount", b."checkIn", b."checkOut", b.guests, b."createdAt",
        (SELECT "firstName" || ' ' || "lastName" FROM users WHERE id = b."userId") as customer,
        (SELECT name FROM hotels WHERE id = b."hotelId") as hotel
       FROM bookings b ${whereClause} ORDER BY b."createdAt" DESC`,
      params
    );

    const columns = [
      { header: "Booking #", key: "bookingNumber", width: 18 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Hotel", key: "hotel", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Check In", key: "checkIn", width: 15 },
      { header: "Check Out", key: "checkOut", width: 15 },
      { header: "Guests", key: "guests", width: 10 },
      { header: "Total", key: "totalAmount", width: 12 },
      { header: "Created", key: "createdAt", width: 15 },
    ];

    const mapped = bookings.map((b: any) => ({
      bookingNumber: b.bookingNumber,
      customer: b.customer,
      hotel: b.hotel,
      status: b.status,
      checkIn: new Date(b.checkIn).toLocaleDateString(),
      checkOut: new Date(b.checkOut).toLocaleDateString(),
      guests: b.guests,
      totalAmount: `$${parseFloat(b.totalAmount).toFixed(2)}`,
      createdAt: new Date(b.createdAt).toLocaleDateString(),
    }));

    if (format === "pdf") {
      await exportToPdf(res, "Booking Report", mapped, columns, "booking_report");
    } else {
      await exportToExcel(res, mapped, columns, "booking_report");
    }
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};

export const exportRevenueReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, format } = req.query as any;
    const conditions: string[] = [`p.status = 'COMPLETED'`];
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      conditions.push(`p."createdAt" >= $${paramIndex++} AND p."createdAt" <= $${paramIndex++}`);
      params.push(new Date(startDate), new Date(endDate));
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const payments = await getMany(
      `SELECT p.amount, p.method, p."createdAt", p."invoiceNumber",
        (SELECT "firstName" || ' ' || "lastName" FROM users WHERE id = p."userId") as customer
       FROM payments p ${whereClause} ORDER BY p."createdAt" DESC`,
      params
    );

    const columns = [
      { header: "Invoice", key: "invoiceNumber", width: 18 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Method", key: "method", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Date", key: "date", width: 15 },
    ];

    const mapped = payments.map((p: any) => ({
      invoiceNumber: p.invoiceNumber,
      customer: p.customer,
      method: p.method,
      amount: `$${parseFloat(p.amount).toFixed(2)}`,
      date: new Date(p.createdAt).toLocaleDateString(),
    }));

    if (format === "pdf") {
      await exportToPdf(res, "Revenue Report", mapped, columns, "revenue_report");
    } else {
      await exportToExcel(res, mapped, columns, "revenue_report");
    }
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
};
