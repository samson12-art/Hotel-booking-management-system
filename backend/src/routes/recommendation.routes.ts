import { Router } from "express";
import { getMyRecommendations, refreshRecommendations } from "../controllers/recommendation.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getMyRecommendations);
router.post("/refresh", authenticate, refreshRecommendations);

export default router;
