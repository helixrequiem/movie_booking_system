const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movie_id: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    screen_id: { type: mongoose.Schema.Types.ObjectId, ref: "Screen", required: true },
    start_time: { type: Date, required: true },
    base_price: { type: Number, required: true },
  },
  { timestamps: true }
);

showtimeSchema.index({ screen_id: 1, start_time: 1 });

module.exports = mongoose.model("Showtime", showtimeSchema);