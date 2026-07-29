import { Router } from "express";
import { uploadIdDocument, getIdVerificationStatus, getPendingVerifications, reviewIdDocument } from "../controllers/idVerification.controller";
import { authenticate, authorize } from "../middleware/auth";
import { uploadIdDocument as uploadIdMiddleware } from "../middleware/upload";

const router = Router();

router.post("/upload", authenticate, uploadIdMiddleware.single("idDocument"), uploadIdDocument);
router.get("/status", authenticate, getIdVerificationStatus);
router.get("/", authenticate, authorize("ADMIN"), getPendingVerifications);
router.put("/:id/review", authenticate, authorize("ADMIN"), reviewIdDocument);

export default router;
