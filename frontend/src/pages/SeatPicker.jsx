import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./SeatPicker.css";

const CATEGORY_PRICE_MULTIPLIER = {
  Normal: 1,
  Premium: 1.5,
  Recliner: 2,
};

function SeatPicker() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function loadSeats() {
    return api.get(`/showtimes/${showtimeId}/seats`).then((res) => setSeats(res.data));
  }

  useEffect(() => {
    Promise.all([api.get(`/showtimes/${showtimeId}`), loadSeats()])
      .then(([showtimeRes]) => setShowtime(showtimeRes.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [showtimeId]);

  const rows = useMemo(() => {
    const grouped = {};
    seats.forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [seats]);

  function toggleSeat(seat) {
    if (seat.status === "booked") return;
    setSelected((prev) =>
      prev.includes(seat._id) ? prev.filter((id) => id !== seat._id) : [...prev, seat._id]
    );
  }

  function seatPrice(seat) {
    const base = showtime?.base_price || 0;
    return Math.round(base * (CATEGORY_PRICE_MULTIPLIER[seat.category] || 1));
  }

  const totalPrice = seats
    .filter((s) => selected.includes(s._id))
    .reduce((sum, s) => sum + seatPrice(s), 0);

  async function handleCheckout() {
    setSubmitError(null);

    if (!user) {
      // Send them to log in, and remember to come back to this exact seat picker after
      navigate("/login", { state: { from: `/showtimes/${showtimeId}/seats` } });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        showtime_id: showtimeId,
        seat_ids: selected,
        customer_name: user.name,
        customer_email: user.email,
      });
      navigate(`/bookings/${res.data.booking_id}`);
    } catch (err) {
      if (err.response?.status === 409) {
        setSubmitError(err.response.data.error);
        setSelected([]);
        await loadSeats();
      } else {
        setSubmitError(err.response?.data?.error || err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="status-message">Loading seats…</div>;
  if (error) return <div className="status-message error">Couldn't load seats: {error}</div>;

  return (
    <div className="seat-page">
      <Link to={`/movies/${showtime.movie_id._id}/showtimes`} className="back-link">
        ← Back to showtimes
      </Link>

      <h1 className="seat-title">{showtime.movie_id.title}</h1>
      <p className="seat-subtitle">
        {showtime.screen_id.name} ·{" "}
        {new Date(showtime.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div className="screen-indicator">SCREEN</div>

      <div className="seat-map">
        {rows.map(([row, rowSeats]) => (
          <div className="seat-row" key={row}>
            <span className="row-label">{row}</span>
            {rowSeats
              .sort((a, b) => a.number - b.number)
              .map((seat) => (
                <button
                  key={seat._id}
                  disabled={seat.status === "booked"}
                  className={`seat seat-${seat.category.toLowerCase()} ${
                    selected.includes(seat._id) ? "selected" : ""
                  } ${seat.status === "booked" ? "booked" : ""}`}
                  onClick={() => toggleSeat(seat)}
                  title={
                    seat.status === "booked"
                      ? `${seat.row}${seat.number} · Already booked`
                      : `${seat.row}${seat.number} · ${seat.category} · ₹${seatPrice(seat)}`
                  }
                >
                  {seat.number}
                </button>
              ))}
          </div>
        ))}
      </div>

      <div className="legend">
        <span>
          <i className="legend-swatch seat-normal" /> Normal
        </span>
        <span>
          <i className="legend-swatch seat-premium" /> Premium
        </span>
        <span>
          <i className="legend-swatch seat-recliner" /> Recliner
        </span>
        <span>
          <i className="legend-swatch selected" /> Selected
        </span>
        <span>
          <i className="legend-swatch booked" /> Booked
        </span>
      </div>

      {selected.length > 0 && !user && (
        <div className="checkout-form">
          <p className="login-prompt">
            <Link to="/login" state={{ from: `/showtimes/${showtimeId}/seats` }}>
              Log in
            </Link>{" "}
            to complete your booking.
          </p>
        </div>
      )}

      {selected.length > 0 && submitError && (
        <div className="checkout-form">
          <p className="form-error">{submitError}</p>
        </div>
      )}

      <div className="booking-bar">
        <div>
          <span className="seat-count">{selected.length} seat(s) selected</span>
          <span className="total-price">₹{totalPrice}</span>
        </div>
        <button
          className="checkout-btn"
          disabled={selected.length === 0 || submitting}
          onClick={handleCheckout}
        >
          {submitting ? "Booking…" : user ? "Proceed to Checkout" : "Log in to Book"}
        </button>
      </div>
    </div>
  );
}

export default SeatPicker;