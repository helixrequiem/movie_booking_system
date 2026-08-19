const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    provider: { type: String, required: true }, // "mock" for now
    provider_txn_id: { type: String },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);