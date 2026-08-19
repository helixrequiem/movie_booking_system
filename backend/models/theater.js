const mongoose = require("mongoose");

const theaterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Theater", theaterSchema);