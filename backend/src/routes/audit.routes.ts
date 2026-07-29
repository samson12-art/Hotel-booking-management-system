import { Router } from "express";
import { getAuditLogs, getAuditLogById } from "../controllers/audit.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), getAuditLogs);
router.get("/:id", authenticate, authorize("ADMIN"), getAuditLogById);

export default router;
