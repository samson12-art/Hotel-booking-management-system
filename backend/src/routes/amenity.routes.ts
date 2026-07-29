import { Router } from "express";
import { createAmenity, getAllAmenities, deleteAmenity } from "../controllers/amenity.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", getAllAmenities);
router.post("/", authenticate, authorize("ADMIN"), createAmenity);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteAmenity);

export default router;
