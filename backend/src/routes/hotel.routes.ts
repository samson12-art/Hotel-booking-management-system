import { Router } from "express";
import {
  createHotel, updateHotel, getHotelById, getAllHotels, deleteHotel,
  uploadHotelImages, addHotelAmenity, removeHotelAmenity,
  addHotelPolicy, removeHotelPolicy, getManagerHotels,
} from "../controllers/hotel.controller";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { uploadHotelImages as upload } from "../middleware/upload";

const router = Router();

router.get("/", optionalAuth, getAllHotels);
router.get("/manager", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), getManagerHotels);
router.get("/:id", optionalAuth, getHotelById);
router.post("/", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), createHotel);
router.put("/:id", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), updateHotel);
router.delete("/:id", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), deleteHotel);
router.post("/:id/images", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), upload.array("images", 10), uploadHotelImages);
router.post("/:id/amenities", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), addHotelAmenity);
router.delete("/:id/amenities/:amenityId", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), removeHotelAmenity);
router.post("/:id/policies", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), addHotelPolicy);
router.delete("/:id/policies/:policyId", authenticate, authorize("HOTEL_MANAGER", "ADMIN"), removeHotelPolicy);

export default router;
