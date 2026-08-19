const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
  {
    theater_id: { type: mongoose.Schema.Types.ObjectId, ref: "Theater", required: true },
    name: { type: String, required: true }, // e.g. "Screen 3"
    total_seats: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Screen", screenSchema);