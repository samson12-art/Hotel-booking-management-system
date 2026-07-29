import { Router } from "express";
import { getBookingReport, getRevenueReport, getOccupancyReport, getCustomerReport, getCancellationReport, exportBookingReport, exportRevenueReport } from "../controllers/report.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/bookings", authenticate, authorize("ADMIN", "HOTEL_MANAGER"), getBookingReport);
router.get("/revenue", authenticate, authorize("ADMIN", "HOTEL_MANAGER"), getRevenueReport);
router.get("/occupancy", authenticate, authorize("ADMIN", "HOTEL_MANAGER"), getOccupancyReport);
router.get("/customers", authenticate, authorize("ADMIN"), getCustomerReport);
router.get("/cancellations", authenticate, authorize("ADMIN"), getCancellationReport);

router.get("/export/bookings", authenticate, authorize("ADMIN", "HOTEL_MANAGER"), exportBookingReport);
router.get("/export/revenue", authenticate, authorize("ADMIN", "HOTEL_MANAGER"), exportRevenueReport);

export default router;
