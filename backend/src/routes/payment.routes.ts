import { Router } from "express";
import { processPayment, getMyPayments, getPaymentById, getAllPayments, refundPayment } from "../controllers/payment.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), getAllPayments);
router.post("/", authenticate, processPayment);
router.get("/my", authenticate, getMyPayments);
router.get("/:id", authenticate, getPaymentById);
router.put("/:id/refund", authenticate, authorize("ADMIN"), refundPayment);

export default router;
