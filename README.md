# Hotel Booking & Management System

A full-stack Hotel Booking & Management System with **Next.js 14**, **Express.js**, **PostgreSQL**, and **raw SQL**.

> **Live Demo:** [http://localhost:3000](http://localhost:3000)  
> **API Docs:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, CSS Modules, Zustand |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL (pg library, parameterized queries) |
| **Auth** | JWT (access + refresh tokens), bcrypt (12 rounds) |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **Testing** | Jest, Supertest |

---

## Features by Portal

### 👤 Customer Portal
| Feature | Description |
|---------|-------------|
| **Auth** | Register, login, forgot/reset password, email verification |
| **Hotel Search** | Filter by city, price range, rating, room type, facilities; sort by price/rating/popularity |
| **Hotel Details** | Photos, room listings, amenities, policies, reviews, Google Maps location |
| **Booking** | Date picker, room selection, guest count, special requests, coupon validation |
| **Payment** | Mock gateway — Credit Card, PayPal, Telebirr, CBE Birr, Cash |
| **My Dashboard** | Booking history, upcoming stays, payment history, receipts |
| **Reviews** | Rate & review hotels with photo uploads |
| **Favorites** | Save/bookmark hotels (wishlist) |
| **Loyalty Program** | Earn points per booking; tiers: Bronze → Silver → Gold → Platinum |
| **Recommendations** | AI-powered hotel suggestions based on preferences |
| **Notifications** | In-app notification center; check-in reminder emails |
| **Profile** | Update info, ID document upload & verification |
| **Chat Support** | Real-time messaging with hotel staff |
| **Contact Hotel** | Inquiry form per hotel |
| **Receipt Upload** | Upload payment receipts for manual verification |
| **Multi-Currency** | Display in USD, ETB, EUR, GBP |
| **Multi-Language** | English & Amharic (extensible) |
| **Dark Mode** | Persistent theme toggle |
| **PWA** | Installable as a mobile app |

### 🏨 Hotel Manager Portal
| Feature | Description |
|---------|-------------|
| **Hotel Management** | CRUD hotels; upload photos; add amenities & policies |
| **Room Management** | CRUD rooms (Standard, Deluxe, Suite, Family, Executive); set seasonal pricing |
| **Booking Management** | View bookings; confirm, reject, check-in, check-out |
| **Dashboard** | Stats: occupancy rate, revenue, booking counts |
| **Contact Inquiries** | View messages from guests |

### 🔐 Admin Panel
| Feature | Description |
|---------|-------------|
| **User Management** | Manage all users, roles (Customer/Manager/Staff/Admin) |
| **Hotel Management** | Manage all hotels & managers |
| **Booking Management** | Oversee all bookings & payments |
| **Dashboard** | Analytics: revenue trends, occupancy rates, booking trends, most-booked hotels |
| **Reports** | Booking, Revenue, Occupancy, Customer, Cancellation reports |
| **Export** | PDF & Excel export for all reports |
| **Coupons** | Create/manage discount coupons with usage limits |
| **ID Verification** | Review & approve/reject user ID documents |
| **Audit Logs** | Track all user actions across the system |
| **Master Data** | Manage amenities, cities, countries, translations, currencies |

---

## Quick Start

### Prerequisites
- Node.js v18+, PostgreSQL v14+, npm

### 1. Clone & Install
```bash
git clone <repo-url>
cd hotel-booking-system

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Database Setup
```bash
# Create database
createdb hotel_booking_db

# Edit backend/.env with your credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hotel_booking_db?schema=public"

# Seed data & run migrations
cd backend
npm run seed
psql $DATABASE_URL -f prisma/migration_add_missing_tables.sql
psql $DATABASE_URL -f prisma/migration-email-verification-and-invoice.sql
psql $DATABASE_URL -f prisma/migration-add-id-verification-and-receipts.sql
```

### 3. Run
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

### 4. Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hotel.com | Password123 |
| Hotel Manager | manager1@hotel.com | Password123 |
| Customer | customer@hotel.com | Password123 |
| Staff | staff@hotel.com | Password123 |

---

## API Overview

### Auth
`POST /api/v1/auth/register` · `POST /api/v1/auth/login` · `POST /api/v1/auth/forgot-password` · `POST /api/v1/auth/reset-password` · `GET /api/v1/auth/me`

### Hotels
`GET /api/v1/hotels` · `GET /api/v1/hotels/:id` · `POST /api/v1/hotels` · `PUT /api/v1/hotels/:id` · `DELETE /api/v1/hotels/:id` · `POST /api/v1/hotels/:id/images` · `POST /api/v1/hotels/:id/amenities` · `POST /api/v1/hotels/:id/policies`

### Rooms
`GET /api/v1/rooms/hotel/:hotelId` · `GET /api/v1/rooms/:id` · `GET /api/v1/rooms/availability` · `POST /api/v1/rooms/hotel/:hotelId` · `PUT /api/v1/rooms/:id` · `DELETE /api/v1/rooms/:id` · `PUT /api/v1/rooms/:id/status` · `POST /api/v1/rooms/:id/seasonal-pricing`

### Bookings
`POST /api/v1/bookings` · `GET /api/v1/bookings/my` · `GET /api/v1/bookings/:id` · `PUT /api/v1/bookings/:id/cancel` · `PUT /api/v1/bookings/:id/confirm` · `PUT /api/v1/bookings/:id/reject` · `PUT /api/v1/bookings/:id/check-in` · `PUT /api/v1/bookings/:id/check-out`

### Payments
`POST /api/v1/payments` · `GET /api/v1/payments/my` · `GET /api/v1/payments/:id` · `PUT /api/v1/payments/:id/refund`

### Reviews
`POST /api/v1/reviews` · `GET /api/v1/reviews/hotel/:hotelId` · `PUT /api/v1/reviews/:id` · `DELETE /api/v1/reviews/:id`

### Dashboard & Reports
`GET /api/v1/dashboard/admin` · `GET /api/v1/dashboard/customer` · `GET /api/v1/dashboard/manager` · `GET /api/v1/reports/bookings` · `GET /api/v1/reports/revenue` · `GET /api/v1/reports/occupancy` · `GET /api/v1/reports/customers` · `GET /api/v1/reports/cancellations` · `GET /api/v1/reports/export/bookings?format=pdf|excel` · `GET /api/v1/reports/export/revenue?format=pdf|excel`

### Contact & Chat
`POST /api/v1/contacts` · `GET /api/v1/contacts` · `GET /api/v1/contacts/hotel/:hotelId` · `PUT /api/v1/contacts/:id/read` · `GET /api/v1/chat` · `POST /api/v1/chat` · `GET /api/v1/chat/:userId` · `PUT /api/v1/chat/:id/read`

### Loyalty
`GET /api/v1/loyalty` · `GET /api/v1/loyalty/transactions` · `POST /api/v1/loyalty/redeem`

### Misc
`GET /api/v1/translations?locale=en` · `GET /api/v1/translations/locales` · `POST /api/v1/translations` · `GET /api/v1/currencies` · `POST /api/v1/currencies/convert` · `GET /api/v1/recommendations` · `POST /api/v1/recommendations/refresh` · `GET /api/v1/audit-logs` · `GET /api/v1/favorites` · `POST /api/v1/favorites` · `DELETE /api/v1/favorites/:hotelId` · `GET /api/v1/notifications` · `PUT /api/v1/notifications/:id/read` · `PUT /api/v1/notifications/read-all` · `DELETE /api/v1/notifications/:id` · `GET /api/v1/amenities` · `GET /api/v1/locations/countries` · `GET /api/v1/locations/cities` · `GET /api/v1/coupons` · `POST /api/v1/coupons/validate`

---

## Security

- JWT auth with access + refresh tokens
- Password hashing (bcrypt, 12 rounds)
- Role-based access control (Customer, Manager, Staff, Admin)
- CSRF token protection
- Rate limiting on all endpoints
- Input validation (Zod schemas)
- Helmet.js HTTP headers
- CORS whitelist
- Parameterized queries (no SQL injection)
- XSS sanitization (xss-clean)
- Full audit logging

---

## Database Schema

**Core:** users, hotels, hotel_images, rooms, room_images, amenities, hotel_amenities, room_amenities, hotel_policies, bookings, booking_details, payments, reviews, coupons, notifications, cities, countries, favorites, seasonal_pricing, receipts

**Extensions:** audit_logs, contacts, loyalty_points, loyalty_transactions, chat_messages, translations, currency_rates, recommendations, csrf_tokens

---

## Bonus Features

- Google Maps integration on hotel detail page
- QR Code booking confirmation
- Loyalty program (Bronze → Silver → Gold → Platinum)
- AI-powered hotel recommendations
- Real-time chat widget
- Multi-language (English & Amharic)
- Multi-currency display
- Dark mode (persistent)
- PWA — installable on mobile/desktop
- Discount coupons
- Wishlist (favorites)
- Fully responsive design
- Swagger API docs
- PDF & Excel report export

---

## Tests

```bash
cd backend
npm test
```

---

## License

MIT
