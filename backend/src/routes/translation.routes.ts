import { Router } from "express";
import { getTranslations, getSupportedLocales, createTranslation } from "../controllers/translation.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", getTranslations);
router.get("/locales", getSupportedLocales);
router.post("/", authenticate, authorize("ADMIN"), createTranslation);

export default router;
