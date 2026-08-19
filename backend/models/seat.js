const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema(
  {
    screen_id: { type: mongoose.Schema.Types.ObjectId, ref: "Screen", required: true },
    row: { type: String, required: true }, // e.g. "A"
    number: { type: Number, required: true }, // e.g. 12
    category: {
      type: String,
      enum: ["Normal", "Premium", "Recliner"],
      default: "Normal",
    },
  },
  { timestamps: true }
);

seatSchema.index({ screen_id: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("Seat", seatSchema);