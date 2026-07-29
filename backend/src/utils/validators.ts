import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const hotelSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10),
  address: z.string().min(5),
  cityId: z.string().uuid(),
  countryId: z.string().uuid(),
  starRating: z.number().int().min(1).max(5),
  phoneNumber: z.string().min(5),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal("")),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const roomSchema = z.object({
  roomNumber: z.string().min(1),
  type: z.enum(["STANDARD", "DELUXE", "SUITE", "FAMILY", "EXECUTIVE"]),
  description: z.string().optional(),
  capacity: z.number().int().min(1).max(20),
  beds: z.number().int().min(1).max(10),
  bathroom: z.string().default("Private"),
  price: z.number().positive(),
  status: z.enum(["AVAILABLE", "RESERVED", "OCCUPIED", "CLEANING", "MAINTENANCE"]).optional(),
});

export const bookingSchema = z.object({
  hotelId: z.string().uuid(),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid check-in date"),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid check-out date"),
  guests: z.number().int().min(1).max(20),
  roomIds: z.array(z.string().uuid()).min(1, "At least one room must be selected"),
  specialRequests: z.string().optional(),
  couponCode: z.string().optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().uuid(),
  method: z.enum(["CREDIT_CARD", "PAYPAL", "TELEBIRR", "CBE_BIRR", "CASH"]),
  transactionId: z.string().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  photos: z.array(z.string()).optional(),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().optional(),
  discountPercent: z.number().int().min(1).max(100),
  maxDiscount: z.number().positive().optional(),
  minBookingAmount: z.number().positive().optional(),
  validFrom: z.string().refine((val) => !isNaN(Date.parse(val))),
  validUntil: z.string().refine((val) => !isNaN(Date.parse(val))),
  usageLimit: z.number().int().positive().optional(),
});
