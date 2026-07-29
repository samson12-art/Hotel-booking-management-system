-- Migration: Add ID verification and receipt tables
-- Run this against your PostgreSQL database before starting the server.

-- 1. Add ID verification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "idVerificationStatus" TEXT DEFAULT 'NONE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "idVerificationNote" TEXT;

-- 2. Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "fileUrl" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  note TEXT,
  "verifiedBy" TEXT,
  "userId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "receipts_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES bookings(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "receipts_userId_idx" ON receipts("userId");
CREATE INDEX IF NOT EXISTS "receipts_bookingId_idx" ON receipts("bookingId");
CREATE INDEX IF NOT EXISTS "receipts_status_idx" ON receipts(status);
