import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import "./MovieList.css";

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/movies")
      .then((res) => setMovies(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Unique languages found across all movies, built client-side so the dropdown
  // always matches whatever's actually in the database
  const languages = useMemo(() => {
    const set = new Set(movies.map((m) => m.language).filter(Boolean));
    return Array.from(set).sort();
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesLanguage = !language || m.language === language;
      return matchesSearch && matchesLanguage;
    });
  }, [movies, search, language]);

  if (loading) return <div className="status-message">Loading movies…</div>;
  if (error)
    return (
      <div className="status-message error">
        Couldn't load movies: {error}. Is your backend running on port 5050?
      </div>
    );

  return (
    <div className="movie-list-page">
      <header className="marquee">
        <span className="marquee-eyebrow">Now Showing</span>
        <h1>Book Your Show</h1>
      </header>

      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon"></span>
          <input
            type="text"
            placeholder="Search movies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">All Languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {filteredMovies.length === 0 ? (
        <div className="status-message">No movies match your search.</div>
      ) : (
        <div className="movie-grid">
          {filteredMovies.map((movie) => (
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
                {movie.formats?.length > 0 && (
                  <span className="format-tag">{movie.formats.join(" / ")}</span>
                )}
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
      )}
    </div>
  );
}

export default MovieList;