import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./MyBookings.css";

function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  function loadBookings() {
    return api
      .get("/bookings/mine")
      .then((res) => setBookings(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message));
  }

  useEffect(() => {
    if (!user) return;
    loadBookings().finally(() => setLoading(false));
  }, [user]);

  async function handleCancel(e, bookingId) {
    e.preventDefault(); // don't navigate into the ticket when clicking Cancel
    e.stopPropagation();
    if (!confirm("Cancel this booking? Your seats will be released.")) return;

    setCancellingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await loadBookings();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setCancellingId(null);
    }
  }

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" state={{ from: "/my-bookings" }} replace />;

  return (
    <div className="mybookings-page">
      <h1>My Bookings</h1>

      {loading ? (
        <div className="status-message">Loading your bookings…</div>
      ) : error ? (
        <div className="status-message error">Couldn't load bookings: {error}</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>You haven't booked anything yet.</p>
          <Link to="/movies" className="browse-link">
            Browse movies →
          </Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => {
            const showtime = b.showtime_id;
            const movie = showtime?.movie_id;
            const theater = showtime?.screen_id?.theater_id;
            const seatLabels = b.seats
              .map((s) => `${s.row}${s.number}`)
              .sort()
              .join(", ");

            return (
              <Link to={`/bookings/${b._id}`} className="booking-item" key={b._id}>
                {movie?.poster_url && (
                  <img src={movie.poster_url} alt={movie.title} className="booking-poster" />
                )}
                <div className="booking-info">
                  <h2>{movie?.title || "Movie"}</h2>
                  <p className="booking-meta">
                    {theater?.name}
                    {theater?.city && ` · ${theater.city}`}
                  </p>
                  <p className="booking-meta">
                    {showtime?.start_time &&
                      new Date(showtime.start_time).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                  </p>
                  <p className="booking-seats">Seats: {seatLabels || "—"}</p>
                </div>
                <div className="booking-side">
                  <span className={`status-pill ${b.status}`}>{b.status}</span>
                  <span className="booking-price">₹{b.total_amount}</span>
                  {b.status === "confirmed" && (
                    <button
                      className="cancel-btn"
                      onClick={(e) => handleCancel(e, b._id)}
                      disabled={cancellingId === b._id}
                    >
                      {cancellingId === b._id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;