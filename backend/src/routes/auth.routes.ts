import { Router } from "express";
import { register, login, forgotPassword, resetPassword, getMe, verifyEmail, resendVerification } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authenticate, resendVerification);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", authenticate, getMe);

export default router;
