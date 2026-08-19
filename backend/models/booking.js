const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customer_name: { type: String, required: true },
    customer_email: { type: String, required: true },
    showtime_id: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    total_amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);