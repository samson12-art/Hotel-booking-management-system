import { Router } from "express";
import { getMyLoyalty, getLoyaltyTransactions, redeemLoyaltyPoints } from "../controllers/loyalty.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getMyLoyalty);
router.get("/transactions", authenticate, getLoyaltyTransactions);
router.post("/redeem", authenticate, redeemLoyaltyPoints);

export default router;
