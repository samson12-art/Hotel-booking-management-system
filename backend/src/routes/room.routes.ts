import { Router } from "express";
import {
  createRoom, updateRoom, getRoomById, getHotelRooms, checkAvailability,
  updateRoomStatus, deleteRoom, uploadRoomImages, addRoomAmenity,
  removeRoomAmenity, setSeasonalPricing,
} from "../controllers/room.controller";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { uploadRoomImages as upload } from "../middleware/upload";

const router = Router();

router.get("/hotel/:hotelId", optionalAuth, getHotelRooms);
router.get("/availability", checkAvailability);
router.get("/:id", optionalAuth, getRoomById);
router.post("/hotel/:hotelId", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), createRoom);
router.put("/:id", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), updateRoom);
router.delete("/:id", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), deleteRoom);
router.post("/:id/images", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), upload.array("images", 10), uploadRoomImages);
router.put("/:id/status", authenticate, authorize("HOTEL_MANAGER", "STAFF", "ADMIN"), updateRoomStatus);
router.post("/:id/amenities", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), addRoomAmenity);
router.delete("/:id/amenities/:amenityId", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), removeRoomAmenity);
router.post("/:id/seasonal-pricing", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), setSeasonalPricing);

export default router;
