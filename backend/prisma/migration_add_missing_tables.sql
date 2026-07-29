-- Migration: Add missing tables for audit logs, contacts, loyalty points, chat, QR codes

-- 1. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50),
  "entityId" VARCHAR(100),
  details JSONB,
  ip VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs("createdAt");

-- 2. Contacts (Hotel Contact Requests)
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "hotelId" TEXT REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_hotelId ON contacts("hotelId");

-- 3. Loyalty Points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'BRONZE',
  "totalPoints" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 4. Loyalty Transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  description VARCHAR(255),
  "referenceId" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_userId ON loyalty_transactions("userId");

-- 5. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "senderId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  "bookingId" TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_senderId ON chat_messages("senderId");
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiverId ON chat_messages("receiverId");

-- 6. Multi-language content translations
CREATE TABLE IF NOT EXISTS translations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  locale VARCHAR(10) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE(locale, key)
);

-- 7. Currency rates
CREATE TABLE IF NOT EXISTS currency_rates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10),
  rate DECIMAL(10,4) NOT NULL DEFAULT 1.0000,
  "isDefault" BOOLEAN DEFAULT false,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 8. AI recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  "hotelId" TEXT REFERENCES hotels(id) ON DELETE CASCADE,
  score DECIMAL(5,2),
  reason VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "hotelId")
);

-- 9. User sessions for CSRF
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(100) UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_userId ON csrf_tokens("userId");
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_token ON csrf_tokens(token);

-- Insert default currencies
INSERT INTO currency_rates (id, code, name, symbol, rate, "isDefault") VALUES
  (gen_random_uuid()::text, 'USD', 'US Dollar', '$', 1.0000, true),
  (gen_random_uuid()::text, 'ETB', 'Ethiopian Birr', 'Br', 57.5000, false),
  (gen_random_uuid()::text, 'EUR', 'Euro', '€', 0.9200, false),
  (gen_random_uuid()::text, 'GBP', 'British Pound', '£', 0.7900, false)
ON CONFLICT (code) DO NOTHING;

-- Insert default translations (English)
INSERT INTO translations (id, locale, key, value) VALUES
  (gen_random_uuid()::text, 'en', 'home.title', 'Welcome to XY Hotel'),
  (gen_random_uuid()::text, 'en', 'home.subtitle', 'Experience world-class luxury in the heart of Addis Ababa'),
  (gen_random_uuid()::text, 'en', 'nav.home', 'Home'),
  (gen_random_uuid()::text, 'en', 'nav.hotels', 'Hotels'),
  (gen_random_uuid()::text, 'en', 'nav.bookings', 'My Bookings'),
  (gen_random_uuid()::text, 'en', 'nav.profile', 'Profile'),
  (gen_random_uuid()::text, 'en', 'nav.admin', 'Admin'),
  (gen_random_uuid()::text, 'en', 'nav.logout', 'Logout'),
  (gen_random_uuid()::text, 'en', 'auth.login', 'Login'),
  (gen_random_uuid()::text, 'en', 'auth.register', 'Register'),
  (gen_random_uuid()::text, 'en', 'booking.title', 'Book Your Stay'),
  (gen_random_uuid()::text, 'en', 'common.save', 'Save'),
  (gen_random_uuid()::text, 'en', 'common.cancel', 'Cancel'),
  (gen_random_uuid()::text, 'en', 'common.delete', 'Delete'),
  (gen_random_uuid()::text, 'en', 'common.search', 'Search'),
  (gen_random_uuid()::text, 'en', 'common.loading', 'Loading...')
ON CONFLICT (locale, key) DO NOTHING;

-- Insert Amharic translations
INSERT INTO translations (id, locale, key, value) VALUES
  (gen_random_uuid()::text, 'am', 'home.title', 'እንኳን ወደ XY ሆቴል በደህና መጡ'),
  (gen_random_uuid()::text, 'am', 'home.subtitle', 'በአዲስ አበባ መሀል የዓለም ደረጃ ቅንጦት ልምድ ያግኙ'),
  (gen_random_uuid()::text, 'am', 'nav.home', 'መነሻ'),
  (gen_random_uuid()::text, 'am', 'nav.hotels', 'ሆቴሎች'),
  (gen_random_uuid()::text, 'am', 'nav.bookings', 'የእኔ ቦታ ማስያዣ'),
  (gen_random_uuid()::text, 'am', 'nav.profile', 'መገለጫ'),
  (gen_random_uuid()::text, 'am', 'auth.login', 'ግባ'),
  (gen_random_uuid()::text, 'am', 'auth.register', 'ይመዝገቡ'),
  (gen_random_uuid()::text, 'am', 'common.save', 'አስቀምጥ'),
  (gen_random_uuid()::text, 'am', 'common.cancel', 'ሰርዝ'),
  (gen_random_uuid()::text, 'am', 'common.search', 'ፈልግ')
ON CONFLICT (locale, key) DO NOTHING;
