import { Router } from "express";
import { sendMessage, getConversation, getMyConversations, markMessageRead } from "../controllers/chat.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getMyConversations);
router.post("/", authenticate, sendMessage);
router.get("/:userId", authenticate, getConversation);
router.put("/:id/read", authenticate, markMessageRead);

export default router;
