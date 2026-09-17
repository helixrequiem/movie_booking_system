const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema(
  {
    theater_id: { type: mongoose.Schema.Types.ObjectId, ref: "Theater", required: true },
    name: { type: String, required: true },
    total_seats: { type: Number, required: true },
    // The auditorium type — drives the "theater type" filter on the showtimes page
    screen_type: {
      type: String,
      enum: ["Standard", "IMAX", "4DX", "Recliner Lounge"],
      default: "Standard",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Screen", screenSchema);