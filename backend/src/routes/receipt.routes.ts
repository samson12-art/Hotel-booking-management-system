import { Router } from "express";
import { uploadReceipt, getMyReceipts, getAllReceipts, reviewReceipt } from "../controllers/receipt.controller";
import { authenticate, authorize } from "../middleware/auth";
import { uploadReceipt as uploadReceiptMiddleware } from "../middleware/upload";

const router = Router();

router.post("/upload", authenticate, uploadReceiptMiddleware.single("receipt"), uploadReceipt);
router.get("/my", authenticate, getMyReceipts);
router.get("/", authenticate, authorize("ADMIN"), getAllReceipts);
router.put("/:id/review", authenticate, authorize("ADMIN"), reviewReceipt);

export default router;
