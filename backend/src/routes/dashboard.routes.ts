import { Router } from "express";
import { getAdminDashboard, getCustomerDashboard, getManagerDashboard } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/admin", authenticate, authorize("ADMIN"), getAdminDashboard);
router.get("/customer", authenticate, getCustomerDashboard);
router.get("/manager", authenticate, authorize("HOTEL_MANAGER"), getManagerDashboard);

export default router;
