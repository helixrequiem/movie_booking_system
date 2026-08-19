require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple health check route so you have something to hit in the browser
app.get("/", (req, res) => {
  res.send("Movie booking API is running");
});

app.use("/api/movies", require("./routes/movies"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/theaters", require("./routes/theaters"));
app.use("/api/screens", require("./routes/screens"));
app.use("/api/showtimes", require("./routes/showtimes"));
app.use("/api/bookings", require("./routes/bookings"));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });