# Hotel Booking & Management System

A full-stack Hotel Booking & Management System built with Next.js, Express.js, PostgreSQL, and raw SQL.

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL with raw SQL (pg library)
- **Authentication:** JWT (JSON Web Tokens)
- **API Docs:** Swagger/OpenAPI
- **State Management:** Zustand
- **Testing:** Jest, Supertest

## Features

### Customer Portal
- Register/Login with JWT authentication
- Forgot password / Reset password
- Search & filter hotels by city, price, rating, room type, facilities
- Sort by lowest/highest price, highest rated, most popular
- View hotel details, rooms, amenities, reviews
- Google Maps integration on hotel details
- Book rooms with date selection
- QR Code booking confirmation
- Mock payment gateway (Credit Card, PayPal, Telebirr, CBE Birr, Cash)
- View booking history & download receipts
- Leave reviews & ratings with photo uploads
- Save favorite hotels
- Loyalty points system (Bronze/Silver/Gold/Platinum tiers)
- AI-powered hotel recommendations
- Notification center
- Profile management with ID verification
- Contact hotel form
- Multi-currency support
- Multi-language support (English, Amharic)
- Chat support widget
- Dark mode toggle
- PWA support (installable)

### Hotel Manager Portal
- Manage hotels (CRUD)
- Upload hotel photos
- Add amenities & policies
- Manage rooms (Standard, Deluxe, Suite, Family, Executive)
- Set pricing & seasonal pricing
- View & manage bookings (confirm, reject, check-in, check-out)
- Dashboard with stats
- View contact inquiries

### Admin Panel
- Manage all users, hotels, managers, bookings, payments
- Dashboard with analytics (revenue, occupancy, booking trends, most booked hotels)
- Reports: Booking, Revenue, Occupancy, Customer, Cancellation
- Export reports as PDF or Excel
- Audit logs for all system actions
- Manage coupons & discounts
- Manage amenities, cities, countries
- ID verification management
- Role-based access control
- CSRF protection

## Project Structure

```
hotel-booking-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema reference
│   │   └── seed.ts              # Seed data
│   ├── src/
│   │   ├── __tests__/           # Test cases
│   │   ├── config/              # Database, Swagger config
│   │   ├── controllers/         # Route handlers
│   │   ├── middleware/           # Auth, audit, CSRF, upload, error handling
│   │   ├── routes/              # API routes
│   │   ├── services/            # SMS, QR, currency, loyalty, recommendations
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Helpers, validators, pagination, export
│   │   └── app.ts               # Express entry point
│   ├── uploads/                 # File uploads
│   ├── .env                     # Environment variables
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   │   ├── auth/            # Login, Register, Forgot Password
│   │   │   ├── hotels/          # Hotel listing & detail
│   │   │   ├── booking/         # Booking checkout
│   │   │   ├── contact/         # Contact hotel form
│   │   │   ├── dashboard/       # Customer dashboard
│   │   │   ├── profile/         # User profile
│   │   │   ├── notifications/   # Notifications
│   │   │   ├── admin/           # Admin panel
│   │   │   └── manager/         # Hotel manager portal
│   │   ├── components/          # Reusable components
│   │   ├── context/             # Theme context
│   │   ├── lib/                 # API client & utilities
│   │   └── store/               # Zustand stores
│   └── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd hotel-booking-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Configure Environment
```bash
# Edit .env file with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/hotel_booking_db?schema=public"
JWT_SECRET="your-jwt-secret"
CORS_ORIGIN="http://localhost:3000"
```

### 4. Setup Database
```bash
# Create the database
createdb hotel_booking_db

# Run the main schema (if not already applied via Prisma)
# The schema is managed through raw SQL; seed data is provided
npm run seed

# Run additional migration for new tables (audit, contacts, chat, etc.)
psql $DATABASE_URL -f prisma/migration_add_missing_tables.sql
```

### 5. Start Backend
```bash
npm run dev
# Backend runs on http://localhost:5000
# API Docs at http://localhost:5000/api-docs
```

### 6. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 7. Run Tests
```bash
cd backend
npm test
```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hotel.com | Password123 |
| Hotel Manager | manager1@hotel.com | Password123 |
| Customer | customer@hotel.com | Password123 |
| Staff | staff@hotel.com | Password123 |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Hotels
- `GET /api/v1/hotels` - List hotels (with search/filter/sort)
- `GET /api/v1/hotels/:id` - Get hotel details
- `POST /api/v1/hotels` - Create hotel (Manager)
- `PUT /api/v1/hotels/:id` - Update hotel
- `DELETE /api/v1/hotels/:id` - Delete hotel
- `POST /api/v1/hotels/:id/images` - Upload hotel images
- `POST /api/v1/hotels/:id/amenities` - Add amenity
- `POST /api/v1/hotels/:id/policies` - Add policy

### Rooms
- `GET /api/v1/rooms/hotel/:hotelId` - Get hotel rooms
- `GET /api/v1/rooms/:id` - Get room details
- `GET /api/v1/rooms/availability` - Check availability
- `POST /api/v1/rooms/hotel/:hotelId` - Create room
- `PUT /api/v1/rooms/:id` - Update room
- `DELETE /api/v1/rooms/:id` - Delete room
- `PUT /api/v1/rooms/:id/status` - Update room status
- `POST /api/v1/rooms/:id/seasonal-pricing` - Set seasonal pricing

### Bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/my` - My bookings
- `GET /api/v1/bookings/:id` - Get booking details
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking
- `PUT /api/v1/bookings/:id/confirm` - Confirm (Manager)
- `PUT /api/v1/bookings/:id/reject` - Reject (Manager)
- `PUT /api/v1/bookings/:id/check-in` - Check-in (Staff)
- `PUT /api/v1/bookings/:id/check-out` - Check-out (Staff)

### Payments
- `POST /api/v1/payments` - Process payment
- `GET /api/v1/payments/my` - My payments
- `GET /api/v1/payments/:id` - Payment details
- `PUT /api/v1/payments/:id/refund` - Refund (Admin)

### Reviews
- `POST /api/v1/reviews` - Create review
- `GET /api/v1/reviews/hotel/:hotelId` - Hotel reviews
- `PUT /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review

### Dashboard
- `GET /api/v1/dashboard/admin` - Admin dashboard
- `GET /api/v1/dashboard/customer` - Customer dashboard
- `GET /api/v1/dashboard/manager` - Manager dashboard

### Reports
- `GET /api/v1/reports/bookings` - Booking report
- `GET /api/v1/reports/revenue` - Revenue report
- `GET /api/v1/reports/occupancy` - Occupancy report
- `GET /api/v1/reports/customers` - Customer report
- `GET /api/v1/reports/cancellations` - Cancellation report
- `GET /api/v1/reports/export/bookings?format=pdf|excel` - Export booking report
- `GET /api/v1/reports/export/revenue?format=pdf|excel` - Export revenue report

### Contact
- `POST /api/v1/contacts` - Submit contact form
- `GET /api/v1/contacts` - List all contacts (Admin)
- `GET /api/v1/contacts/hotel/:hotelId` - Hotel contacts (Manager)
- `PUT /api/v1/contacts/:id/read` - Mark contact read

### Loyalty
- `GET /api/v1/loyalty` - My loyalty info
- `GET /api/v1/loyalty/transactions` - My loyalty transactions
- `POST /api/v1/loyalty/redeem` - Redeem points

### Chat
- `GET /api/v1/chat` - My conversations
- `POST /api/v1/chat` - Send message
- `GET /api/v1/chat/:userId` - Get conversation with user
- `PUT /api/v1/chat/:id/read` - Mark message read

### Multi-language
- `GET /api/v1/translations?locale=en` - Get translations
- `GET /api/v1/translations/locales` - Supported locales
- `POST /api/v1/translations` - Create translation (Admin)

### Multi-currency
- `GET /api/v1/currencies` - List currencies
- `POST /api/v1/currencies/convert` - Convert amount

### Recommendations
- `GET /api/v1/recommendations` - My recommendations
- `POST /api/v1/recommendations/refresh` - Refresh recommendations

### Audit Logs
- `GET /api/v1/audit-logs` - List audit logs (Admin)
- `GET /api/v1/audit-logs/:id` - Get audit log detail (Admin)

### Favorites
- `GET /api/v1/favorites` - My favorites
- `POST /api/v1/favorites` - Add favorite
- `DELETE /api/v1/favorites/:hotelId` - Remove favorite

### Notifications
- `GET /api/v1/notifications` - My notifications
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification

### Other
- `GET /api/v1/amenities` - List amenities
- `GET /api/v1/locations/countries` - List countries
- `GET /api/v1/locations/cities` - List cities
- `GET /api/v1/coupons` - List coupons
- `POST /api/v1/coupons/validate` - Validate coupon

## Security

- JWT Authentication with token expiry
- Password hashing with bcrypt (12 rounds)
- Role-Based Access Control (Customer, Manager, Staff, Admin)
- CSRF token protection for state-changing requests
- Rate limiting on API endpoints
- Input validation with Zod schemas
- Helmet.js for HTTP headers security
- CORS configuration
- SQL injection protection via parameterized queries
- XSS protection (xss-clean)
- Audit logging for all user actions
- Input sanitization on all inputs

## Database Schema

**Core tables:** Users, Roles, Hotels, HotelImages, Rooms, RoomImages, Amenities, HotelAmenities, RoomAmenities, HotelPolicies, Bookings, BookingDetails, Payments, Reviews, Coupons, Notifications, Cities, Countries, Favorites, SeasonalPricing, Receipts

**Additional tables:** AuditLogs, Contacts, LoyaltyPoints, LoyaltyTransactions, ChatMessages, Translations, CurrencyRates, Recommendations, CsrfTokens

## Bonus Features

- Google Maps integration on hotel details
- QR Code booking confirmation
- Loyalty points program (Bronze → Silver → Gold → Platinum)
- AI-powered hotel recommendations based on preferences
- Real-time chat support widget
- Multi-language support (English, Amharic)
- Multi-currency display (USD, ETB, EUR, GBP)
- Dark mode with persistent preference
- Progressive Web App (PWA) - installable
- Coupons & discount codes
- Wishlist (favorites)
- Mobile-responsive design
- Swagger/OpenAPI documentation
- CSV/Excel report export

## License

MIT
