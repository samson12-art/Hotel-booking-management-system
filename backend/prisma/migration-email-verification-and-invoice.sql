-- Migration: Add email verification columns and invoice-related schema enhancements
-- Run this against your PostgreSQL database before starting the server.

-- 1. Ensure verificationToken column exists on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationToken" TEXT;

-- 2. Ensure isVerified column has a default
ALTER TABLE users ALTER COLUMN "isVerified" SET DEFAULT false;

-- 3. Add bookingId to notifications for context (e.g., check-in reminders)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "bookingId" TEXT;

CREATE INDEX IF NOT EXISTS "notifications_bookingId_idx" ON notifications("bookingId");

-- 4. Index for check-in reminder queries
CREATE INDEX IF NOT EXISTS "bookings_checkIn_status_idx" ON bookings("checkIn", status);
