import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import "./MovieList.css";

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/movies")
      .then((res) => setMovies(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="status-message">Loading movies…</div>;
  if (error)
    return (
      <div className="status-message error">
        Couldn't load movies: {error}. Is your backend running on port 5050?
      </div>
    );
  if (movies.length === 0)
    return <div className="status-message">No movies found. Did you run the seed script?</div>;

  return (
    <div className="movie-list-page">
      <header className="marquee">
        <span className="marquee-eyebrow">Now Showing</span>
        <h1>Book Your Show</h1>
      </header>

      <div className="movie-grid">
        {movies.map((movie) => (
          <div
            className="movie-card"
            key={movie._id}
            onClick={() => navigate(`/movies/${movie._id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(`/movies/${movie._id}`);
            }}
          >
            <div className="poster-frame">
              <img src={movie.poster_url} alt={movie.title} />
              <span className="genre-tag">{movie.genre}</span>
            </div>
            <div className="movie-info">
              <h2>{movie.title}</h2>
              <p className="meta">
                {movie.language} · {movie.duration_mins} min
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MovieList;