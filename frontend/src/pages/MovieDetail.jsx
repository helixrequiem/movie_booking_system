import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import "./MovieDetail.css";

// Extracts a YouTube video ID from common URL formats so we can build an embed URL
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function MovieDetail() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/movies/${movieId}`)
      .then((res) => setMovie(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) return <div className="status-message">Loading movie…</div>;
  if (error) return <div className="status-message error">Couldn't load movie: {error}</div>;

  const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);

  return (
    <div className="detail-page">
      <Link to="/" className="back-link">
        ← All movies
      </Link>

      <div className="detail-hero">
        {showTrailer && embedUrl ? (
          <div className="trailer-embed">
            <iframe
              src={`${embedUrl}?autoplay=1`}
              title={`${movie.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div
            className="detail-poster"
            style={{ backgroundImage: `url(${movie.poster_url})` }}
          >
            {embedUrl && (
              <button className="trailer-btn" onClick={() => setShowTrailer(true)}>
                ▶ Trailer
              </button>
            )}
          </div>
        )}
      </div>

      <div className="detail-body">
        <h1>{movie.title}</h1>

        <div className="detail-meta-row">
          {movie.rating != null && (
            <span className="rating-badge">
              ★ {movie.rating}/10
              {movie.vote_count > 0 && (
                <span className="vote-count"> ({formatVotes(movie.vote_count)} votes)</span>
              )}
            </span>
          )}
          <span className="meta-text">
            {movie.duration_mins} min · {movie.genre} ·{" "}
            {movie.release_date && new Date(movie.release_date).getFullYear()}
          </span>
        </div>

        <div className="tag-row">
          <span className="tag">{movie.language}</span>
        </div>

        {movie.description && <p className="description">{movie.description}</p>}

        {movie.cast?.length > 0 && (
          <div className="cast-section">
            <h2>Cast</h2>
            <div className="cast-grid">
              {movie.cast.map((c, i) => (
                <div className="cast-card" key={i}>
                  <div
                    className="cast-photo"
                    style={
                      c.photo_url
                        ? { backgroundImage: `url(${c.photo_url})` }
                        : undefined
                    }
                  >
                    {!c.photo_url && c.name.charAt(0)}
                  </div>
                  <span className="cast-name">{c.name}</span>
                  {c.role && <span className="cast-role">{c.role}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="book-btn"
          onClick={() => navigate(`/movies/${movie._id}/showtimes`)}
        >
          Book Tickets
        </button>
      </div>
    </div>
  );
}

function formatVotes(count) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
  return count;
}

export default MovieDetail;