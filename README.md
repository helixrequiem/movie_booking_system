# Book Your Show: Movie Ticket Booking Platform

A full-stack movie ticket booking website inspired by BookMyShow, built with the MERN stack as a semester web technology project. Users can discover movies, pick a showtime, choose seats on a live seat map, review their order and book. Admins manage the whole catalogue from a protected panel.

**Live demo:** https://book-your-show-plum.vercel.app/

---

## Features

### For users
- **Movie discovery:** search by title, filter by language and by format (2D / 3D). Each movie has a trailer, description, cast and rating.
- **Smart showtimes:** a 7-day date strip, shows grouped by theater, and filter chips for format and theater type (for example Standard, IMAX, Dolby). Shows that have already started are hidden.
- **Live seat map:** Normal, Premium and Recliner seats with category pricing. Booked seats are blocked.
- **Review before paying:** a confirmation page shows the movie, theater, time, seats and total. Nothing is booked until the user presses **Confirm & Pay**; **Go Back** books nothing.
- **Tickets and history:** a ticket page after booking, and a My Bookings page listing every booking.
- **Cancellation with a cutoff:** bookings can be cancelled up to 2 hours before the show. Cancelling frees the seats and marks the mock payment as refunded.
- **Authentication:** register and log in. Booking requires an account, and the user returns to the same page after logging in.

### For admins
- Role-gated admin panel with tabs for **Movies, Theaters, Screens and Showtimes**, each with full create, edit and delete.
- Seats are generated automatically when a screen is created (last row Recliner, the two rows before it Premium, the rest Normal).
- Each showtime has its own format (2D/3D) and base price, so the same movie can run in different formats on different screens.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios |
| Backend | Node.js, Express |
| Database | MongoDB Atlas with Mongoose |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## Architecture

```
Browser (React, Vercel)  --HTTPS / JSON-->  Express API (Node, Render)  --Mongoose-->  MongoDB Atlas
        UI, routing,         <--JSON + JWT--     routes, middleware,                    9 collections
        Axios client                             pricing and seat checks
```

The server is the source of truth: it verifies the JWT, recalculates prices and checks seat conflicts. The client only displays data.

---

## Database design

Nine entities, normalized to 3NF, with a few deliberate denormalizations.

| Entity | Main fields |
|---|---|
| User | name, email (unique), password_hash, phone, is_admin |
| Movie | title, description, language, genre, duration_mins, poster_url, trailer_url, rating, cast[], formats[] |
| Theater | name, city, address |
| Screen | theater_id, name, total_seats, screen_type |
| Seat | screen_id, row, number, category (unique on screen_id + row + number) |
| Showtime | movie_id, screen_id, start_time, base_price, format (2D/3D) |
| Booking | user_id, showtime_id, status (pending, confirmed, cancelled), total_amount, customer_name, customer_email |
| BookingSeat | booking_id, seat_id, price (join table: Booking M:N Seat) |
| Payment | booking_id, provider, provider_txn_id, status (pending, success, failed, refunded), amount |

Relationships: Theater 1:N Screen, Screen 1:N Seat, Screen 1:N Showtime, Movie 1:N Showtime, User 1:N Booking, Showtime 1:N Booking, Booking M:N Seat (through BookingSeat), Booking 1:N Payment.

Deliberate denormalizations: `Booking.total_amount`, `Booking.customer_name/email` (a snapshot at booking time), embedded `Movie.cast`, and the informational `Movie.formats`.

See `DATABASE_DESIGN.md` for the full normalization walkthrough.

---

## Business rules

- **Seat price** = `round(showtime.base_price x category multiplier)`, where Normal = 1, Premium = 1.5 and Recliner = 2. The server recalculates this and the price paid is stored per seat in `BookingSeat`.
- **No double-booking:** the server checks every requested seat against all non-cancelled bookings for the showtime and returns `409 Conflict` on a clash.
- **Booking closes when the show starts.** Requests for a started show return `400`.
- **Cancellation closes 2 hours before the show,** enforced on the server and mirrored in the UI.
- **Only the owner can cancel** a booking.

---

## Project structure

```
backend/
  server.js
  seed.js
  cleanup.js
  middleware/   requireAuth.js, requireAdmin.js
  models/       user, movie, theater, screen, seat, showtime, booking, bookingSeat, payment
  routes/       auth, movies, theaters, screens, showtimes, bookings

frontend/
  src/
    api/client.js          Axios instance with token interceptor
    context/AuthContext.jsx
    components/Header.jsx
    pages/                 Landing, MovieList, MovieDetail, ShowtimeList, SeatPicker,
                           ConfirmBooking, BookingConfirmation, MyBookings,
                           Login, Register, Admin
```

---

## API overview

| Resource | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Movies | `GET /api/movies` (search, language, format), `GET /api/movies/:id`; admin: `POST`, `PUT`, `DELETE` |
| Theaters | `GET /api/theaters`; admin: `POST`, `PUT`, `DELETE` |
| Screens | `GET /api/screens`; admin: `POST`, `PUT`, `DELETE` |
| Showtimes | `GET /api/showtimes?movie_id=&date=`, `GET /api/showtimes/:id`, `GET /api/showtimes/:id/seats`; admin: `POST`, `PUT`, `DELETE` |
| Bookings | `GET /api/bookings/mine`, `POST /api/bookings`, `GET /api/bookings/:id`, `PUT /api/bookings/:id/cancel` |

Protected routes expect `Authorization: Bearer <token>`.

---

## Getting started

### Prerequisites
- Node.js 18 or later
- A MongoDB Atlas cluster (free tier is fine)

### 1. Clone and install
```bash
git clone <your-repo-url>
cd <repo>

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend
Create `backend/.env`:
```
MONGO_URI=<your MongoDB Atlas connection string>
PORT=5050
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
```
In MongoDB Atlas, allow your IP under Network Access. Never commit `.env`.

### 3. (Optional) Seed sample data
```bash
cd backend
node seed.js
```

### 4. Run
```bash
# terminal 1
cd backend
node server.js

# terminal 2
cd frontend
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

### 5. Make an admin
Register a normal account, then in Atlas open the `users` collection and set `is_admin: true` on that user. Log out and back in.

---

## Deployment

1. **Backend on Render:** root directory `backend`, build command `npm install`, start command `node server.js`. Add `MONGO_URI`, `JWT_SECRET` and `CLIENT_URL` (your Vercel URL) as environment variables.
2. **Frontend on Vercel:** root directory `frontend`. Add `VITE_API_URL` set to `https://<your-render-url>/api`. A `vercel.json` rewrite sends all paths to `index.html` so React Router works on refresh:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
3. Redeploy the frontend after changing any `VITE_` variable, since Vite reads them at build time.

---

## Security

- Passwords are hashed with bcrypt and never stored in plain text.
- JWT sessions with a 7-day expiry, verified by middleware on every protected route.
- `requireAdmin` checks the `is_admin` flag on the server, so hiding the admin link is not the only protection.
- Secrets live in `.env`, which is git-ignored.

---

## Limitations and future scope

| Current limitation | Planned improvement |
|---|---|
| Payment is mocked | Integrate Razorpay or Stripe with webhooks |
| Seat check is not fully atomic | MongoDB transactions and a unique index on (showtime, seat) |
| No seat hold while paying | Temporary seat lock with an expiry |
| No email or SMS ticket | Ticket email with a QR code |
| Web only | React Native app on the same API |
| No automated tests | Unit and API tests with CI |

---

## Author

`Banpynsuk Nongkynrih`, 