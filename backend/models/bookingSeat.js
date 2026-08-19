const mongoose = require("mongoose");

// Join table: links a booking to the specific seats reserved,
// each with the price actually paid for that seat's category.
const bookingSeatSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    seat_id: { type: mongoose.Schema.Types.ObjectId, ref: "Seat", required: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

bookingSeatSchema.index({ booking_id: 1, seat_id: 1 }, { unique: true });

module.exports = mongoose.model("BookingSeat", bookingSeatSchema);