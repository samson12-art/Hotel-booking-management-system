import { Router } from "express";
import { createCoupon, getAllCoupons, updateCoupon, deleteCoupon, validateCoupon } from "../controllers/coupon.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), getAllCoupons);
router.post("/", authenticate, authorize("ADMIN"), createCoupon);
router.post("/validate", authenticate, validateCoupon);
router.put("/:id", authenticate, authorize("ADMIN"), updateCoupon);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteCoupon);

export default router;
