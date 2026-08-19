import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import MovieList from "./pages/MovieList";
import MovieDetail from "./pages/MovieDetail";
import ShowtimeList from "./pages/ShowtimeList";
import SeatPicker from "./pages/SeatPicker";
import BookingConfirmation from "./pages/BookingConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import MyBookings from "./pages/MyBookings";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<MovieList />} />
        <Route path="/movies/:movieId" element={<MovieDetail />} />
        <Route path="/movies/:movieId/showtimes" element={<ShowtimeList />} />
        <Route path="/showtimes/:showtimeId/seats" element={<SeatPicker />} />
        <Route path="/bookings/:bookingId" element={<BookingConfirmation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Routes>
    </>
  );
}

export default App;