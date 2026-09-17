const mongoose = require("mongoose");

const castMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String },
    photo_url: { type: String },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    duration_mins: { type: Number, required: true },
    language: { type: String, required: true },
    genre: { type: String },
    poster_url: { type: String },
    release_date: { type: Date },
    trailer_url: { type: String },
    rating: { type: Number, min: 0, max: 10 },
    vote_count: { type: Number, default: 0 },
    cast: [castMemberSchema],
    // Which formats this movie is available in — shown as filter chips on the browse page
    formats: {
      type: [String],
      enum: ["2D", "3D"],
      default: ["2D"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);