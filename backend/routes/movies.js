const express = require("express");
const router = express.Router();
const Movie = require("../models/movie");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// GET /api/movies?search=&language=&format=
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.search) {
      // Case-insensitive partial match on title
      filter.title = { $regex: req.query.search, $options: "i" };
    }
    if (req.query.language) {
      filter.language = req.query.language;
    }
    if (req.query.format) {
      filter.formats = req.query.format; // matches if the formats array contains this value
    }

    const movies = await Movie.find(filter).sort({ release_date: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id
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