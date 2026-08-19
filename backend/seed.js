require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("./models/movie");
const Theater = require("./models/theater");
const Screen = require("./models/screen");
const Seat = require("./models/seat");
const Showtime = require("./models/showtime");

const sampleMovies = [
  {
    title: "The Last Signal",
    description: "A crew races to decode a message from deep space before time runs out.",
    duration_mins: 128,
    language: "English",
    genre: "Sci-Fi",
    poster_url: "https://placehold.co/300x450?text=The+Last+Signal",
    release_date: new Date("2026-06-12"),
  },
  {
    title: "Monsoon Wedding Chronicles",
    description: "Three generations collide at a chaotic family wedding.",
    duration_mins: 142,
    language: "Hindi",
    genre: "Drama",
    poster_url: "https://placehold.co/300x450?text=Monsoon+Wedding",
    release_date: new Date("2026-07-01"),
  },
  {
    title: "Midnight Runner",
    description: "A getaway driver has one night to clear his name.",
    duration_mins: 105,
    language: "English",
    genre: "Action",
    poster_url: "https://placehold.co/300x450?text=Midnight+Runner",
    release_date: new Date("2026-08-01"),
  },
];

// Builds a simple 5 rows x 8 seats layout
function buildSeatLayout(screenId) {
  const rows = ["A", "B", "C", "D", "E"];
  const seats = [];
  rows.forEach((row, rowIndex) => {
    for (let num = 1; num <= 8; num++) {
      let category = "Normal";
      if (rowIndex === rows.length - 1) category = "Recliner";
      else if (rowIndex >= rows.length - 3) category = "Premium";

      seats.push({ screen_id: screenId, row, number: num, category });
    }
  });
  return seats;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data so re-running this script doesn't duplicate anything
    await Promise.all([
      Movie.deleteMany({}),
      Theater.deleteMany({}),
      Screen.deleteMany({}),
      Seat.deleteMany({}),
      Showtime.deleteMany({}),
    ]);

    const movies = await Movie.insertMany(sampleMovies);
    console.log(`Inserted ${movies.length} movies`);

    const theater = await Theater.create({
      name: "PVR Downtown",
      city: "Shillong",
      address: "Police Bazar, Shillong",
    });
    console.log(`Inserted theater: ${theater.name}`);

    const screen = await Screen.create({
      theater_id: theater._id,
      name: "Screen 1",
      total_seats: 40,
    });
    console.log(`Inserted screen: ${screen.name}`);

    const seats = await Seat.insertMany(buildSeatLayout(screen._id));
    console.log(`Inserted ${seats.length} seats`);

    // One showtime per movie, a few hours apart, all on the same screen/day
    const baseDate = new Date();
    baseDate.setHours(18, 0, 0, 0); // 6:00 PM today

    const showtimeDocs = movies.map((movie, i) => ({
      movie_id: movie._id,
      screen_id: screen._id,
      start_time: new Date(baseDate.getTime() + i * 3 * 60 * 60 * 1000), // 3 hrs apart
      base_price: 250,
    }));

    const showtimes = await Showtime.insertMany(showtimeDocs);
    console.log(`Inserted ${showtimes.length} showtimes`);

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();