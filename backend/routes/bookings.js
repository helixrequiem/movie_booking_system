const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Booking = require("../models/booking");
const BookingSeat = require("../models/bookingSeat");
const Payment = require("../models/payment");
const Showtime = require("../models/showtime");
const Seat = require("../models/seat");
require("../models/movie");
require("../models/screen");
require("../models/theater");
const requireAuth = require("../middleware/requireAuth");

// GET /api/bookings/mine - all bookings for the logged-in user, most recent first
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user_id: req.userId })
      .populate({
        path: "showtime_id",
        populate: [
          { path: "movie_id", select: "title poster_url" },
          { path: "screen_id", select: "name theater_id", populate: { path: "theater_id", select: "name city" } },
        ],
      })
      .sort({ createdAt: -1 });

    // Attach each booking's seats so the list can show "A1, A2" etc without extra requests
    const bookingIds = bookings.map((b) => b._id);
    const allSeats = await BookingSeat.find({ booking_id: { $in: bookingIds } }).populate(
      "seat_id",
      "row number"
    );
    const seatsByBooking = {};
    allSeats.forEach((bs) => {
      const key = bs.booking_id.toString();
      if (!seatsByBooking[key]) seatsByBooking[key] = [];
      seatsByBooking[key].push(bs.seat_id);
    });

    const result = bookings.map((b) => ({
      ...b.toObject(),
      seats: seatsByBooking[b._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings
// body: { showtime_id, seat_ids: [...], customer_name, customer_email }
router.post("/", requireAuth, async (req, res) => {
  const { showtime_id, seat_ids, customer_name, customer_email } = req.body;

  if (!showtime_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    return res.status(400).json({ error: "showtime_id and at least one seat_id are required" });
  }
  if (!customer_name || !customer_email) {
    return res.status(400).json({ error: "customer_name and customer_email are required" });
  }

  try {
    const showtime = await Showtime.findById(showtime_id);
    if (!showtime) return res.status(404).json({ error: "Showtime not found" });

    // Step 1: find every OTHER booking already made for this same showtime
    const existingBookings = await Booking.find({
      showtime_id,
      status: { $ne: "cancelled" },
    }).select("_id");
    const existingBookingIds = existingBookings.map((b) => b._id);

    // Step 2: check if any of the requested seats are already reserved in those bookings
    const conflicts = await BookingSeat.find({
      booking_id: { $in: existingBookingIds },
      seat_id: { $in: seat_ids },
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: "One or more selected seats were just booked by someone else. Please reselect.",
      });
    }

    // Step 3: fetch the actual seats to compute price by category
    const seats = await Seat.find({ _id: { $in: seat_ids } });
    if (seats.length !== seat_ids.length) {
      return res.status(400).json({ error: "One or more seat_ids are invalid" });
    }

    const priceMultiplier = { Normal: 1, Premium: 1.5, Recliner: 2 };
    const seatPrices = seats.map((seat) => ({
      seat_id: seat._id,
      price: Math.round(showtime.base_price * (priceMultiplier[seat.category] || 1)),
    }));
    const total_amount = seatPrices.reduce((sum, s) => sum + s.price, 0);

    // Step 4: create the booking, its seats, and a mock "successful" payment
    const booking = await Booking.create({
      user_id: req.userId,
      customer_name,
      customer_email,
      showtime_id,
      status: "confirmed",
      total_amount,
    });

    await BookingSeat.insertMany(
      seatPrices.map((s) => ({
        booking_id: booking._id,
        seat_id: s.seat_id,
        price: s.price,
      }))
    );

    await Payment.create({
      booking_id: booking._id,
      provider: "mock",
      provider_txn_id: `MOCK-${Date.now()}`,
      status: "success",
      amount: total_amount,
    });

    res.status(201).json({ booking_id: booking._id, total_amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:id - booking confirmation details
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "showtime_id",
      populate: [{ path: "movie_id" }, { path: "screen_id" }],
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const bookingSeats = await BookingSeat.find({ booking_id: booking._id }).populate("seat_id");

    res.json({ booking, seats: bookingSeats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id/cancel - cancel a booking (frees the seats for that showtime)
router.put("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Only the booking's own user can cancel it
    if (booking.user_id?.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only cancel your own bookings" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "This booking is already cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;