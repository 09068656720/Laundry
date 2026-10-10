# What changed (real-world update)

## Requested fixes
1. **Prices come from the database.** `POST /api/orders` only accepts `serviceId` + `quantity`; name, category and unit price are read from the `services` table (must belong to that laundry and be active). Browser-supplied prices are ignored.
2. **Unapproved laundries cannot receive orders** (checked in the API, not only hidden in the UI).
3. **`JWT_SECRET` is mandatory** (32+ chars, example values rejected). The old hard-coded fallback is gone. *Your current `.env` uses the old example secret, so the server will refuse to start until you set a new one.*
4. **Order numbers cannot collide**: they come from a PostgreSQL sequence (`KN-2026-10001`, ...).
5. **Transactions**: registration, order creation, intake, price-change request/approve/decline and status updates are all-or-nothing.

## Making it a real application
- `db/index.js`: real PostgreSQL only; no silent in-memory fallback; schema is created automatically on start (no demo data).
- New `npm run create-admin` (admins can never self-register).
- Demo switcher, one-click demo logins and `/auth/demo-accounts` removed. `npm run db:seed` kept for optional dev data; refuses to run in production.
- Passwords: min 8 characters (12 bcrypt rounds); email format validated; partners must give a phone number.
- CORS limited to `CLIENT_URL`; login/register rate-limited (30 per 15 min per IP); server errors no longer leak internal messages.

## Extra bugs found and fixed while testing
- A laundry could jump an order to any status (e.g. `placed` -> `completed`) and bypass the customer's price approval. Orders now move only through the legal sequence.
- A customer could approve/decline a price request that was already answered. Now only a *pending* request on a `price_pending` order can be answered.
- Price-change requests validated (positive amount, one open request at a time, only while the order is in progress).
- Admins can no longer place customer orders. Order input validated (quantity 1-100, pickup address, date not in the past, payment method whitelist).

## Not changed (still to do before real money)
- **Payments are still simulated** (always "paid"). Paystack/Flutterwave + webhook verification is the next step.
- No email/SMS notifications yet, no photo uploads (intake stores a URL only), no password reset.
