const express = require("express");
const router = express.Router();
const Theater = require("../models/theater");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// GET /api/theaters - list all theaters (optionally filter by city)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.city) filter.city = req.query.city;

    const theaters = await Theater.find(filter);
    res.json(theaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/theaters - create a theater (for seeding/admin use)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const theater = await Theater.create(req.body);
    res.status(201).json(theater);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/theaters/:id - update a theater (admin use)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!theater) return res.status(404).json({ error: "Theater not found" });
    res.json(theater);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/theaters/:id - delete a theater (admin use)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);
    if (!theater) return res.status(404).json({ error: "Theater not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;