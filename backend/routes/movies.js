const express = require("express");
const router = express.Router();
const Movie = require("../models/movie");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// GET /api/movies - list all movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ release_date: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id - get a single movie
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/movies - create a movie (admin use)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/movies/:id - update a movie (admin use)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json(movie);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/movies/:id - delete a movie (admin use)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: "Movie not found" });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;