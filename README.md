> ## ⚠️ REAL-WORLD MODE (read first)
> This project now runs as a **real application**, not a demo:
> - **PostgreSQL is required.** The server refuses to start without `DATABASE_URL` (no more throw-away in-memory database).
> - **No demo accounts, no demo switcher.** Customers and partners register on the site; partners wait for admin approval.
> - **Admins are created only from the command line:** `cd server && npm run create-admin -- you@email.com "Your Name" "AStrongPassword"`
> - **`JWT_SECRET` is required** (32+ random characters, see `server/.env.example`).
> - `npm run db:seed` still exists for **optional** demo data on a *development* machine only (it refuses to run in production).
> - The sections below that mention demo logins / the embedded database describe the old demo mode.
>
> **First-time setup:** (1) create the database `laundry_db`; (2) copy `server/.env.example` to `server/.env` and fill in `JWT_SECRET` and `DATABASE_URL`; (3) `cd server && npm install && npm start` (tables are created automatically); (4) `npm run create-admin -- ...`; (5) `cd client && npm install && npm run dev`; (6) open http://localhost:3000.
>
> **Test everything:** with the server running: `TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=... npm test` (inside `server/`).

# Kano Laundry Platform 🧺

A full-stack, two-sided laundry and dry-cleaning marketplace built for Kano, Nigeria. The platform connects customers with verified local laundries, guarantees garment chain of custody through mandatory intake inspections, enforces customer price-approval safeguards, calculates automated platform commissions, and provides specialized portals for **Customers**, **Laundry Partners**, and **Platform Admins**.

---

## 🌟 Key Features

1. **Two-Sided Marketplace Directory**:
   - Browse vetted laundries across Kano neighborhoods: **Nasarawa, Sabon Gari, Bompai, Tarauni, Fagge, and Kano Municipal**.
   - Filter by garment category (Babbar Riga / Kaftan, Executive Suits, Everyday Wash & Fold, Steam Press, Bedding), doorstep pickup availability, and turnaround speed.
   - Transparent price menus listed in Nigerian Naira (₦).

2. **Garment Chain of Custody & Dispute Prevention**:
   - **Intake Inspection Audit**: Upon collecting or receiving garments, the laundry partner inspects each item and documents physical condition notes (stains, torn hems, missing buttons, embroidery condition).
   - **Unified Inventory**: Both customer and laundry view the identical agreed inventory throughout the lifecycle.

3. **Customer Price Change Approval Protection**:
   - If the laundry discovers stubborn grease, palm oil stains, or delicate embroidery requiring specialized pre-treatment, they propose an adjusted price with detailed notes.
   - **Hard Rule**: Processing is locked until the customer explicitly **Approves** or **Declines** the new price. If declined, the order is cancelled and garments are returned without surprise charges.

4. **Automated Commission & Payout Logic**:
   - **Platform Commission**: Configurable percentage (default 10%) calculated on item subtotal for completed orders.
   - **Laundry Payout**: (Subtotal × 90%) + 100% of Delivery Fee.
   - Financial audit trails stored directly on each order record.

5. **Customer Portal**:
   - Step-by-step booking flow with pickup address, pickup date, and dynamic turnaround date calculation.
   - Live visual status timeline tracking:
     `Placed` → `Accepted` → `Picked Up / Dropped Off` → `Garments Verified` → `Processing` → `Ready` → `Out for Delivery` → `Completed`.
   - Simulated payment flow (Card, Bank Transfer, Pay on Return).
   - Order history, reviews, and dispute submission.

6. **Laundry Partner Portal**:
   - Accept or decline incoming bookings.
   - Physical intake inspection checklist with condition notes and verification.
   - Submit price adjustment requests.
   - Progress orders through the fulfillment lifecycle.
   - Manage services, custom prices in ₦, turnaround days, pickup availability, and delivery fees.

7. **Platform Admin Portal**:
   - Approve or reject partner onboarding requests (only approved laundries appear to customers).
   - Global oversight on all platform orders in Kano.
   - Commission and payout reports grouped by laundry partner and period.
   - Dispute arbitration center.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide React icons, Custom CSS Design System (mobile-first, responsive, accessible).
- **Backend**: Node.js (ES modules), Express, REST API.
- **Database**: PostgreSQL (via `pg`), parameterized SQL queries (`$1, $2, ...`), schema migrations, realistic Kano seed data. Includes a zero-configuration embedded PostgreSQL engine fallback for instant local evaluation without requiring an external PostgreSQL daemon.
- **Authentication**: JWT token-based authentication, `bcryptjs` password hashing, Role-Based Access Control (RBAC).

---

## 🔑 Demo Account Logins

The application includes an **interactive demo switcher ribbon** at the top of every page for 1-click role testing, or you can log in manually with these pre-seeded credentials:

| Role | Email | Password | Description / Location |
|---|---|---|---|
| **Customer** | `customer@kanolaundry.ng` | `Password123!` | Ibrahim Mukhtar (Zoo Road, Tarauni, Kano) |
| **Laundry Partner** | `partner@amanaclean.ng` | `Password123!` | Amana Cleaners & Steamers (Nasarawa GRA, Kano) |
| **Platform Admin** | `admin@kanolaundry.ng` | `Password123!` | Hajiya Amina Bello (Full oversight & commission reports) |

*Additional pre-seeded Kano laundry partners you can log into:*
- Arewa Garment Care (Bompai): `partner@arewacare.ng` / `Password123!`
- Dala Royal Laundry (Kano Municipal): `partner@dalaroyal.ng` / `Password123!`
- Kano Elite Native Care (Sabon Gari): `partner@elitenative.ng` / `Password123!`
- Sahara Express (Tarauni): `partner@saharaexpress.ng` / `Password123!`
- Fagge Textile Care (Fagge): `partner@faggetextile.ng` / `Password123!`
- Kano Heritage Cleaners (Pending Verification): `partner@kanoheritage.ng` / `Password123!`

---

## 🚀 Step-by-Step Setup & Running

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+)
- *(Optional)* **PostgreSQL** instance. If no external database is configured, the platform automatically boots up a zero-configuration embedded PostgreSQL engine so everything works out of the box!

### 2. Installation

Clone or extract the project, then install dependencies:

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Configuration

Check `server/.env` (or copy from `server/.env.example`):

```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-kano-laundry-jwt-key-2026
# Optional: Set your PostgreSQL connection string, or leave unset for embedded engine:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/laundry_db
COMMISSION_RATE=0.10
SERVICE_FEE=300.00
```

### 4. Database Migrations & Kano Seed Data

Run the database setup script to apply SQL migrations and seed the 7 Kano laundries, native services, and demo accounts:

```bash
cd server
npm run db:seed
```

### 5. Running the Application

In terminal 1, start the backend server:
```bash
cd server
npm start
# API running on http://localhost:5000
```

In terminal 2, start the frontend client:
```bash
cd client
npm run dev
# Web application running on http://localhost:3000
```

Open **http://localhost:3000** in your web browser.

---

## 🧪 Automated Testing

Run the end-to-end acceptance test suite to verify the complete order lifecycle, RBAC enforcement, price change approval, and commission mathematics:

```bash
cd server
npm test
```

Test covers:
1. API health check
2. Customer login & JWT validation
3. Approved Kano laundries directory retrieval
4. Pickup order booking with 3 garment items
5. Partner booking acceptance
6. Physical garment intake condition audit
7. Status progression: Processing → Ready → Completed
8. Admin commission audit (10% platform fee + partner payout)
9. Strict RBAC verification (Customer blocked from admin routes with HTTP 403)

---

## 🗺️ Product Roadmap

### Phase 1 (Built Now)
- [x] Customer, Laundry Partner, and Admin registration & authentication.
- [x] Kano laundry listings with area filters (Nasarawa, Sabon Gari, Bompai, Tarauni, Fagge, Kano Municipal).
- [x] Pickup and drop-off booking flows with delivery fee calculation.
- [x] Dynamic estimated return date calculation based on laundry turnaround days.
- [x] Garment checklist with individual item condition notes.
- [x] Mandatory intake audit recording in the chain of custody.
- [x] Price modification proposal and customer approval mechanism.
- [x] Live visual order status progression timeline.
- [x] Customer order history, review submission, and dispute raising.
- [x] Partner dashboard, order queue, service catalog management, and earnings tracker.
- [x] Admin dashboard, partner approval workflow, and 10% commission reporting.
- [x] Simulated payment flow with extensible payment abstraction layer.

### Phase 2 (Designed Architecture – Ready for Integration)
- **Real Payment Gateways**: Direct Paystack and Flutterwave webhooks with subaccount split payments directly to laundry bank accounts.
- **Rider Dispatch & Logistics**: Dedicated dispatch rider app / SMS coordination for pickup and delivery.
- **Instant SMS / WhatsApp Alerts**: Real-time notifications for status milestones and price change alerts.
- **Automated Payout Batches**: Weekly direct bank disbursements (NIBSS / Paystack Transfer API).

### Phase 3 (Future Expansion)
- **Geolocation & Mapping**: Google Maps Kano neighborhood boundary routing and rider live tracking.
- **Loyalty & Bulk Subscriptions**: Monthly dry-cleaning subscription packages for corporate offices and families.
- **Multi-City Expansion**: Rollout to Kaduna, Abuja, and Lagos.
