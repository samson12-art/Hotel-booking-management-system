import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFound } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import hotelRoutes from "./routes/hotel.routes";
import roomRoutes from "./routes/room.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import reviewRoutes from "./routes/review.routes";
import favoriteRoutes from "./routes/favorite.routes";
import notificationRoutes from "./routes/notification.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import couponRoutes from "./routes/coupon.routes";
import amenityRoutes from "./routes/amenity.routes";
import cityRoutes from "./routes/city.routes";
import idVerificationRoutes from "./routes/idVerification.routes";
import receiptRoutes from "./routes/receipt.routes";
import auditRoutes from "./routes/audit.routes";
import contactRoutes from "./routes/contact.routes";
import loyaltyRoutes from "./routes/loyalty.routes";
import chatRoutes from "./routes/chat.routes";
import translationRoutes from "./routes/translation.routes";
import currencyRoutes from "./routes/currency.routes";
import recommendationRoutes from "./routes/recommendation.routes";
import { startScheduler } from "./services/scheduler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: ".swagger-ui .topbar { display: none }" }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/hotels", hotelRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/favorites", favoriteRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/amenities", amenityRoutes);
app.use("/api/v1/locations", cityRoutes);
app.use("/api/v1/id-verification", idVerificationRoutes);
app.use("/api/v1/receipts", receiptRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/loyalty", loyaltyRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/translations", translationRoutes);
app.use("/api/v1/currencies", currencyRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Hotel Booking & Management System API",
    version: "1.0.0",
    docs: "/api-docs",
  });
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  startScheduler();
});

export default app;
