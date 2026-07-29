import { Router } from "express";
import {
  createBooking, getMyBookings, getBookingById, cancelBooking,
  getHotelBookings, confirmBooking, rejectBooking, checkInGuest,
  checkOutGuest, getAllBookings, downloadInvoice,
} from "../controllers/booking.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), getAllBookings);
router.post("/", authenticate, authorize("CUSTOMER"), createBooking);
router.get("/my", authenticate, getMyBookings);
router.get("/hotel/:hotelId", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), getHotelBookings);
router.get("/:id", authenticate, getBookingById);
router.get("/:id/invoice", authenticate, downloadInvoice);
router.put("/:id/cancel", authenticate, cancelBooking);
router.put("/:id/confirm", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), confirmBooking);
router.put("/:id/reject", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), rejectBooking);
router.put("/:id/check-in", authenticate, authorize("HOTEL_MANAGER", "STAFF", "ADMIN"), checkInGuest);
router.put("/:id/check-out", authenticate, authorize("HOTEL_MANAGER", "STAFF", "ADMIN"), checkOutGuest);

export default router;
