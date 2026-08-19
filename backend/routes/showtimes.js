const express = require("express");
const router = express.Router();
const Showtime = require("../models/showtime");
const Seat = require("../models/seat");
require("../models/screen"); // needed so populate("screen_id") can resolve the Screen model
require("../models/movie"); // needed so populate("movie_id") can resolve the Movie model
require("../models/theater"); // needed so nested populate of screen_id.theater_id can resolve
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// GET /api/showtimes?movie_id=...&date=YYYY-MM-DD - list showtimes, optionally filtered by movie and/or date
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.movie_id) filter.movie_id = req.query.movie_id;

    if (req.query.date) {
      // Interpret the date as a full local day, from 00:00:00 to 23:59:59
      const start = new Date(`${req.query.date}T00:00:00`);
      const end = new Date(`${req.query.date}T23:59:59.999`);
      filter.start_time = { $gte: start, $lte: end };
    }

    const showtimes = await Showtime.find(filter)
      .populate("movie_id", "title poster_url duration_mins")
      .populate({
        path: "screen_id",
        select: "name theater_id",
        populate: { path: "theater_id", select: "name city" },
      })
      .sort({ start_time: 1 });

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/showtimes/:id - single showtime with movie + screen details
router.get("/:id", async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie_id")
      .populate("screen_id");

    if (!showtime) return res.status(404).json({ error: "Showtime not found" });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/showtimes/:id/seats - seat layout for this showtime's screen,
// with seats already booked for THIS showtime marked as unavailable
router.get("/:id/seats", async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id);
    if (!showtime) return res.status(404).json({ error: "Showtime not found" });

    const seats = await Seat.find({ screen_id: showtime.screen_id }).sort({ row: 1, number: 1 });

    // Find which seats are already booked for this specific showtime
    const Booking = require("../models/booking");
    const BookingSeat = require("../models/bookingSeat");
    const bookings = await Booking.find({
      showtime_id: showtime._id,
      status: { $ne: "cancelled" },
    }).select("_id");
    const bookedSeatDocs = await BookingSeat.find({
      booking_id: { $in: bookings.map((b) => b._id) },
    }).select("seat_id");
    const bookedSeatIds = new Set(bookedSeatDocs.map((bs) => bs.seat_id.toString()));

    const seatsWithStatus = seats.map((seat) => ({
      ...seat.toObject(),
      status: bookedSeatIds.has(seat._id.toString()) ? "booked" : "available",
    }));

    res.json(seatsWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/showtimes - create a showtime (for seeding/admin use)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const showtime = await Showtime.create(req.body);
    res.status(201).json(showtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/showtimes/:id - update a showtime (admin use)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!showtime) return res.status(404).json({ error: "Showtime not found" });
    res.json(showtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/showtimes/:id - delete a showtime (admin use)
// Note: existing bookings for this showtime are left as-is, not cancelled automatically.
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) return res.status(404).json({ error: "Showtime not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;