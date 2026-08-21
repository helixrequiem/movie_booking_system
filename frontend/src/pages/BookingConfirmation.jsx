import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import "./BookingConfirmation.css";

function BookingConfirmation() {
  const { bookingId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  function loadBooking() {
    return api
      .get(`/bookings/${bookingId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadBooking().finally(() => setLoading(false));
  }, [bookingId]);

  async function handleCancel() {
    if (!confirm("Cancel this booking? Your seats will be released.")) return;
    setCancelling(true);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await loadBooking();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="status-message">Loading your ticket…</div>;
  if (error) return <div className="status-message error">Couldn't load booking: {error}</div>;

  const { booking, seats } = data;
  const showtime = booking.showtime_id;
  const movie = showtime.movie_id;
  const seatLabels = seats
    .map((s) => `${s.seat_id.row}${s.seat_id.number}`)
    .sort()
    .join(", ");

  return (
    <div className="confirmation-page">
      <div className="ticket">
        <span className={`confirmed-badge ${booking.status === "cancelled" ? "cancelled" : ""}`}>
          {booking.status === "cancelled" ? "Booking Cancelled" : "Booking Confirmed"}
        </span>
        <h1>{movie.title}</h1>
        <p className="ticket-meta">
          {showtime.screen_id.name} ·{" "}
          {new Date(showtime.start_time).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        <div className="ticket-divider" />

        <div className="ticket-row">
          <span>Seats</span>
          <span>{seatLabels}</span>
        </div>
        <div className="ticket-row">
          <span>Booked for</span>
          <span>{booking.customer_name}</span>
        </div>
        <div className="ticket-row">
          <span>Booking ID</span>
          <span className="mono">{booking._id}</span>
        </div>
        <div className="ticket-row total">
          <span>Total paid</span>
          <span>₹{booking.total_amount}</span>
        </div>

        {booking.status === "confirmed" && (
          <button className="cancel-ticket-btn" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Cancel Booking"}
          </button>
        )}
      </div>

      <Link to="/movies" className="back-link">
        ← Book another movie
      </Link>
    </div>
  );
}

export default BookingConfirmation;