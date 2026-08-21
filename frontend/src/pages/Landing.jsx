import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/movies")
      .then((res) => setMovies(res.data.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-page">
      <section className="hero">
        <span className="hero-eyebrow">Your city's cinema, online</span>
        <h1>Book Your Show</h1>
        <p className="hero-subtitle">
          Browse the latest releases, pick your seats, and skip the box office queue.
        </p>
        <div className="hero-actions">
          <button className="hero-cta" onClick={() => navigate("/movies")}>
            Browse Movies
          </button>
          {!user && (
            <button className="hero-cta-secondary" onClick={() => navigate("/register")}>
              Create Account
            </button>
          )}
        </div>
      </section>

      {!loading && movies.length > 0 && (
        <section className="now-showing">
          <div className="now-showing-header">
            <h2>Now Showing</h2>
            <button className="see-all-link" onClick={() => navigate("/movies")}>
              See all →
            </button>
          </div>
          <div className="preview-strip">
            {movies.map((movie) => (
              <div
                className="preview-card"
                key={movie._id}
                onClick={() => navigate(`/movies/${movie._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/movies/${movie._id}`);
                }}
              >
                <div className="preview-poster">
                  <img src={movie.poster_url} alt={movie.title} />
                </div>
                <span className="preview-title">{movie.title}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps-row">
          <div className="step">
            <span className="step-num">1</span>
            <span className="step-label">Pick a movie & showtime</span>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <span className="step-label">Choose your seats</span>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <span className="step-label">Book & get your ticket</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Landing;