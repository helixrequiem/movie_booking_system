# Movie Booking System

A full-stack movie ticket booking web app (MERN stack) built as a semester web tech project — inspired by BookMyShow.

## Features

- Browse movies with trailers, cast, ratings, and descriptions
- Date-based showtime browsing across theaters
- Interactive seat selection with category-based pricing (Normal / Premium / Recliner)
- Real booking with double-booking prevention (seat-level conflict checking)
- User authentication (JWT-based signup/login)
- Admin panel to add/edit/delete movies, theaters, screens, and showtimes (role-gated)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + React Router |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |

## Project Structure

```
backend/
├── models/       Mongoose schemas (Movie, Theater, Screen, Seat, Showtime, Booking, BookingSeat, Payment, User)
├── routes/       Express routes, one file per resource
├── middleware/   requireAuth (JWT verification), requireAdmin (role check)
├── seed.js       Populates sample movies, a theater, screen, seats, and showtimes
├── server.js     App entry point

frontend/
├── src/
│   ├── api/          Axios client (auto-attaches auth token)
│   ├── context/       AuthContext (login/register/logout, persisted to localStorage)
│   ├── components/    Shared UI (Header)
│   ├── pages/          One component per route
```

## Data Model

The schema follows a normalized relational-style design even though MongoDB is document-based, since a booking system benefits from explicit join integrity:

- **Movie** → has many **Showtime**
- **Theater** → has many **Screen**
- **Screen** → has many **Seat** (physical seat layout, fixed per screen)
- **Showtime** → links a Movie to a Screen at a specific time/price
- **Booking** → one row per checkout, linked to a User (or guest name/email) and a Showtime
- **BookingSeat** → join table: which specific seats belong to which Booking, at what price
- **Payment** → one row per Booking (currently a mock payment provider)

Double-booking is prevented by checking, at booking time, whether any requested seat already has a `BookingSeat` row tied to a non-cancelled `Booking` for that same `Showtime`.

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5050
JWT_SECRET=any_long_random_string
```

Seed sample data:
```bash
node seed.js
```

Run the server:
```bash
node server.js
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

### 3. Making yourself an admin

New accounts are not admins by default. In MongoDB Atlas, open the `users` collection, find your account, and manually set `is_admin: true`. Log out and back in for the change to take effect — the "Admin" link will then appear in the header.

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/movies` | — | List movies |
| POST | `/api/movies` | Admin | Create movie |
| PUT | `/api/movies/:id` | Admin | Update movie |
| DELETE | `/api/movies/:id` | Admin | Delete movie |
| GET | `/api/theaters` | — | List theaters |
| POST | `/api/theaters` | Admin | Create theater |
| POST | `/api/screens` | Admin | Create screen (auto-generates seat layout) |
| GET | `/api/showtimes?movie_id=&date=` | — | List showtimes, filterable by movie and date |
| GET | `/api/showtimes/:id/seats` | — | Seat layout with booked/available status |
| POST | `/api/showtimes` | Admin | Create showtime |
| POST | `/api/bookings` | User | Create a booking (checks for seat conflicts) |
| GET | `/api/bookings/:id` | — | Booking confirmation details |
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Log in, returns JWT |

## Known Limitations

- Payment is mocked (no real payment gateway integration)
- No email confirmation is sent after booking
- Admin role is a simple boolean flag, not a full permissions system