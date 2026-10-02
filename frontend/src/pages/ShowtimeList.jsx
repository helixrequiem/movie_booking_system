import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import "./ShowtimeList.css";

function buildNextDays(count = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      key: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString([], { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString([], { month: "short" }),
    });
  }
  return days;
}

function ShowtimeList() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const days = useMemo(() => buildNextDays(), []);
  const [selectedDate, setSelectedDate] = useState(days[0].key);
  const [showtimes, setShowtimes] = useState([]);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [screenTypeFilter, setScreenTypeFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/showtimes?movie_id=${movieId}&date=${selectedDate}`)
      .then((res) => {
        setShowtimes(res.data);
        if (res.data.length > 0) setMovie(res.data[0].movie_id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [movieId, selectedDate]);

  useEffect(() => {
    if (!movie) {
      api.get(`/movies/${movieId}`).then((res) => setMovie(res.data)).catch(() => {});
    }
  }, [movieId, movie]);

  // Reset filters whenever the date changes, since available options can differ per day
  useEffect(() => {
    setScreenTypeFilter("");
    setFormatFilter("");
  }, [selectedDate]);

  const screenTypes = useMemo(() => {
    const set = new Set(showtimes.map((s) => s.screen_id?.screen_type).filter(Boolean));
    return Array.from(set);
  }, [showtimes]);

  const formats = useMemo(() => {
    const set = new Set(showtimes.map((s) => s.format).filter(Boolean));
    return Array.from(set);
  }, [showtimes]);

  const filteredShowtimes = useMemo(() => {
    return showtimes.filter((s) => {
      const matchesType = !screenTypeFilter || s.screen_id?.screen_type === screenTypeFilter;
      const matchesFormat = !formatFilter || s.format === formatFilter;
      return matchesType && matchesFormat;
    });
  }, [showtimes, screenTypeFilter, formatFilter]);

  const byTheater = useMemo(() => {
    const groups = {};
    filteredShowtimes.forEach((s) => {
      const theater = s.screen_id?.theater_id;
      const key = theater?._id || "unknown";
      if (!groups[key]) groups[key] = { theater, showtimes: [] };
      groups[key].showtimes.push(s);
    });
    return Object.values(groups);
  }, [filteredShowtimes]);

  if (error) return <div className="status-message error">Couldn't load showtimes: {error}</div>;

  return (
    <div className="showtime-page">
      <Link to={`/movies/${movieId}`} className="back-link">
        ← Back to movie
      </Link>

      {movie && (
        <div className="movie-header">
          <img src={movie.poster_url} alt={movie.title} className="header-poster" />
          <div>
            <h1>{movie.title}</h1>
            <p className="header-meta">{movie.duration_mins} min</p>
          </div>
        </div>
      )}

      <div className="date-strip">
        {days.map((d) => (
          <button
            key={d.key}
            className={`date-chip ${selectedDate === d.key ? "active" : ""}`}
            onClick={() => setSelectedDate(d.key)}
          >
            <span className="date-weekday">{d.weekday}</span>
            <span className="date-num">{d.dayNum}</span>
            <span className="date-month">{d.month}</span>
          </button>
        ))}
      </div>

      {(formats.length > 1 || screenTypes.length > 1) && (
        <div className="filters-stack">
          {formats.length > 1 && (
            <div className="type-filter-row">
              <span className="filter-label">Format</span>
              <button
                className={`type-chip ${!formatFilter ? "active" : ""}`}
                onClick={() => setFormatFilter("")}
              >
                All
              </button>
              {formats.map((fmt) => (
                <button
                  key={fmt}
                  className={`type-chip ${formatFilter === fmt ? "active" : ""}`}
                  onClick={() => setFormatFilter(fmt)}
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}

          {screenTypes.length > 1 && (
            <div className="type-filter-row">
              <span className="filter-label">Theater Type</span>
              <button
                className={`type-chip ${!screenTypeFilter ? "active" : ""}`}
                onClick={() => setScreenTypeFilter("")}
              >
                All
              </button>
              {screenTypes.map((type) => (
                <button
                  key={type}
                  className={`type-chip ${screenTypeFilter === type ? "active" : ""}`}
                  onClick={() => setScreenTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="status-message">Loading showtimes…</div>
      ) : byTheater.length === 0 ? (
        <div className="status-message">
          {showtimes.length === 0
            ? "No showtimes on this date. Try another day."
            : "No showtimes match your filters. Try clearing them."}
        </div>
      ) : (
        <div className="theater-list">
          {byTheater.map(({ theater, showtimes }) => (
            <div className="theater-block" key={theater?._id || "unknown"}>
              <div className="theater-name-row">
                <h3>{theater?.name || "Unknown theater"}</h3>
                {theater?.city && <span className="theater-city">{theater.city}</span>}
              </div>
              <div className="showtime-grid">
                {showtimes.map((s) => {
                  const time = new Date(s.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <button
                      key={s._id}
                      className="showtime-card"
                      onClick={() => navigate(`/showtimes/${s._id}/seats`)}
                    >
                      <span className="screen-type-label">
                        {s.screen_id?.screen_type}
                        {s.format ? ` · ${s.format}` : ""}
                      </span>
                      <span className="show-time">{time}</span>
                      <span className="show-price">₹{s.base_price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShowtimeList;