const express = require("express");
const router = express.Router();
const Screen = require("../models/screen");
const Seat = require("../models/seat");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// GET /api/screens?theater_id=
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.theater_id) filter.theater_id = req.query.theater_id;
    const screens = await Screen.find(filter);
    res.json(screens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/screens
// body: { theater_id, name, screen_type, rows, seats_per_row }
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { theater_id, name, screen_type = "Standard", rows = 5, seats_per_row = 8 } = req.body;

  if (!theater_id || !name) {
    return res.status(400).json({ error: "theater_id and name are required" });
  }

  try {
    const screen = await Screen.create({
      theater_id,
      name,
      screen_type,
      total_seats: rows * seats_per_row,
    });

    const rowLetters = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
    const seatDocs = [];
    rowLetters.forEach((row, rowIndex) => {
      for (let num = 1; num <= seats_per_row; num++) {
        let category = "Normal";
        if (rowIndex === rows - 1) category = "Recliner";
        else if (rowIndex >= rows - 3) category = "Premium";
        seatDocs.push({ screen_id: screen._id, row, number: num, category });
      }
    });

    const seats = await Seat.insertMany(seatDocs);
    res.status(201).json({ screen, seatCount: seats.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/screens/:id - update name/theater/screen_type only (not seat layout)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, theater_id, screen_type } = req.body;
    const screen = await Screen.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(theater_id && { theater_id }),
        ...(screen_type && { screen_type }),
      },
      { new: true, runValidators: true }
    );
    if (!screen) return res.status(404).json({ error: "Screen not found" });
    res.json(screen);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/screens/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const screen = await Screen.findByIdAndDelete(req.params.id);
    if (!screen) return res.status(404).json({ error: "Screen not found" });
    await Seat.deleteMany({ screen_id: screen._id });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;