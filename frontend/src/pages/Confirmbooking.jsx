import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./ConfirmBooking.css";

const CATEGORY_PRICE_MULTIPLIER = { Normal: 1, Premium: 1.5, Recliner: 2 };

export default function ConfirmBooking() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const seatIds = location.state?.seat_ids || [];
  const seatPickerPath = `/showtimes/${showtimeId}/seats`;

  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Guards: must be logged in and must arrive from the seat picker
  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: seatPickerPath }, replace: true });
    } else if (seatIds.length === 0) {
      navigate(seatPickerPath, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || seatIds.length === 0) return;
    async function load() {
      try {
        const [stRes, seatRes] = await Promise.all([
          api.get(`/showtimes/${showtimeId}`),
          api.get(`/showtimes/${showtimeId}/seats`),
        ]);
        setShowtime(stRes.data);
        setSeats(seatRes.data.filter((s) => seatIds.includes(s._id)));
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId]);

  function seatPrice(seat) {
    const base = showtime?.base_price || 0;
    return Math.round(base * (CATEGORY_PRICE_MULTIPLIER[seat.category] || 1));
  }

  const total = seats.reduce((sum, s) => sum + seatPrice(s), 0);

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        showtime_id: showtimeId,
        seat_ids: seatIds,
        customer_name: user.name,
        customer_email: user.email,
      });
      navigate(`/bookings/${res.data.booking_id}`, { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        // Someone else took a seat — send them back to pick again
        alert(err.response.data.error || "Some seats were just booked. Please pick again.");
        navigate(seatPickerPath, { replace: true });
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!user || seatIds.length === 0) return null;
  if (loading) return <p className="status-message">Loading your order…</p>;
  if (!showtime)
    return <p className="status-message form-error">{error || "Showtime not found."}</p>;

  const movie = showtime.movie_id || {};
  const screen = showtime.screen_id || {};
  const theater = screen.theater_id || {};
  const start = new Date(showtime.start_time);

  return (
    <div className="confirm-page">
      <Link to={seatPickerPath} className="back-link">← Back to seats</Link>
      <h1 className="confirm-title">Review &amp; Confirm</h1>
      <p className="confirm-sub">Please check your order. You won't be charged until you confirm.</p>

      <div className="confirm-card">
        <div className="confirm-top">
          {movie.poster_url && <img src={movie.poster_url} alt={movie.title} className="confirm-poster" />}
          <div>
            <h2>{movie.title}</h2>
            <p className="dim">
              {showtime.format} · {movie.language}
            </p>
            <p>
              <strong>{theater.name}</strong>
              {theater.city ? `, ${theater.city}` : ""}
            </p>
            <p className="dim">
              {screen.name}
              {screen.screen_type ? ` · ${screen.screen_type}` : ""}
            </p>
            <p className="confirm-when">
              {start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <table className="confirm-seats">
          <thead>
            <tr><th>Seat</th><th>Category</th><th className="right">Price</th></tr>
          </thead>
          <tbody>
            {seats.map((s) => (
              <tr key={s._id}>
                <td>{s.row}{s.number}</td>
                <td>{s.category}</td>
                <td className="right">₹{seatPrice(s)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Total ({seats.length} {seats.length === 1 ? "seat" : "seats"})</td>
              <td className="right total">₹{total}</td>
            </tr>
          </tfoot>
        </table>

        <div className="confirm-customer">
          <span className="dim">Booking for</span>
          <strong>{user.name}</strong>
          <span className="dim">{user.email}</span>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="confirm-actions">
          <button className="btn-secondary" onClick={() => navigate(seatPickerPath)} disabled={submitting}>
            Go Back
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Processing…" : `Confirm & Pay ₹${total}`}
          </button>
        </div>
      </div>
    </div>
  );
}