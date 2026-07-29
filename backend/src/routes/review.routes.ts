import { Router } from "express";
import { createReview, getHotelReviews, updateReview, deleteReview, getAllReviews } from "../controllers/review.controller";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { uploadReviewImages } from "../middleware/upload";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), getAllReviews);
router.post("/", authenticate, authorize("CUSTOMER"), uploadReviewImages.array("photos", 5), createReview);
router.get("/hotel/:hotelId", optionalAuth, getHotelReviews);
router.put("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);

export default router;
