import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./Admin.css";

function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    duration_mins: "",
    language: "",
    genre: "",
    poster_url: "",
    release_date: "",
    trailer_url: "",
    rating: "",
    cast: "",
  });
  const [theaterForm, setTheaterForm] = useState({ name: "", city: "", address: "" });
  const [screenForm, setScreenForm] = useState({
    theater_id: "",
    name: "",
    rows: 5,
    seats_per_row: 8,
  });
  const [showtimeForm, setShowtimeForm] = useState({
    movie_id: "",
    screen_id: "",
    start_time: "",
    base_price: "",
  });

  const [status, setStatus] = useState({});
  const [activeTab, setActiveTab] = useState("movies");
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [editingTheaterId, setEditingTheaterId] = useState(null);
  const [editingScreenId, setEditingScreenId] = useState(null);
  const [editingShowtimeId, setEditingShowtimeId] = useState(null);

  function refreshLists() {
    api.get("/theaters").then((res) => setTheaters(res.data));
    api.get("/screens").then((res) => setScreens(res.data));
    api.get("/movies").then((res) => setMovies(res.data));
    api.get("/showtimes").then((res) => setShowtimes(res.data));
  }

  useEffect(refreshLists, []);

  async function submitForm(key, endpoint, payload, resetTo, method = "post") {
    setStatus((s) => ({ ...s, [key]: { type: "loading" } }));
    try {
      await api[method](endpoint, payload);
      setStatus((s) => ({
        ...s,
        [key]: { type: "success", message: method === "put" ? `${key} updated!` : `${key} created!` },
      }));
      refreshLists();
      return resetTo;
    } catch (err) {
      setStatus((s) => ({
        ...s,
        [key]: { type: "error", message: err.response?.data?.error || err.message },
      }));
      return null;
    }
  }

  const emptyMovieForm = {
    title: "",
    description: "",
    duration_mins: "",
    language: "",
    genre: "",
    poster_url: "",
    release_date: "",
    trailer_url: "",
    rating: "",
    cast: "",
  };

  function startEditingMovie(movie) {
    setEditingMovieId(movie._id);
    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      duration_mins: movie.duration_mins || "",
      language: movie.language || "",
      genre: movie.genre || "",
      poster_url: movie.poster_url || "",
      release_date: movie.release_date ? movie.release_date.slice(0, 10) : "",
      trailer_url: movie.trailer_url || "",
      rating: movie.rating ?? "",
      cast: (movie.cast || []).map((c) => `${c.name}${c.role ? " - " + c.role : ""}`).join("\n"),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditingMovie() {
    setEditingMovieId(null);
    setMovieForm(emptyMovieForm);
  }

  async function deleteMovie(id) {
    if (!confirm("Delete this movie? This cannot be undone.")) return;
    try {
      await api.delete(`/movies/${id}`);
      refreshLists();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function handleMovieSubmit(e) {
    e.preventDefault();
    // Cast entered as one "Name - Role" per line, parsed into the array the backend expects
    const cast = movieForm.cast
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, role] = line.split(" - ").map((s) => s.trim());
        return { name, role };
      });

    const payload = {
      ...movieForm,
      rating: movieForm.rating ? Number(movieForm.rating) : undefined,
      cast,
    };

    const isEditing = Boolean(editingMovieId);
    const endpoint = isEditing ? `/movies/${editingMovieId}` : "/movies";
    const method = isEditing ? "put" : "post";

    const reset = await submitForm("movie", endpoint, payload, emptyMovieForm, method);
    if (reset) {
      setMovieForm(reset);
      setEditingMovieId(null);
    }
  }

  function startEditingTheater(theater) {
    setEditingTheaterId(theater._id);
    setTheaterForm({
      name: theater.name || "",
      city: theater.city || "",
      address: theater.address || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditingTheater() {
    setEditingTheaterId(null);
    setTheaterForm({ name: "", city: "", address: "" });
  }

  async function deleteTheater(id) {
    if (!confirm("Delete this theater? This cannot be undone.")) return;
    try {
      await api.delete(`/theaters/${id}`);
      refreshLists();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function handleTheaterSubmit(e) {
    e.preventDefault();
    const isEditing = Boolean(editingTheaterId);
    const endpoint = isEditing ? `/theaters/${editingTheaterId}` : "/theaters";
    const method = isEditing ? "put" : "post";

    const reset = await submitForm(
      "theater",
      endpoint,
      theaterForm,
      { name: "", city: "", address: "" },
      method
    );
    if (reset) {
      setTheaterForm(reset);
      setEditingTheaterId(null);
    }
  }

  function startEditingScreen(screen) {
    setEditingScreenId(screen._id);
    setScreenForm({
      theater_id: screen.theater_id || "",
      name: screen.name || "",
      rows: 5,
      seats_per_row: 8,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditingScreen() {
    setEditingScreenId(null);
    setScreenForm({ theater_id: "", name: "", rows: 5, seats_per_row: 8 });
  }

  async function deleteScreen(id) {
    if (!confirm("Delete this screen and all its seats? This cannot be undone.")) return;
    try {
      await api.delete(`/screens/${id}`);
      refreshLists();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function handleScreenSubmit(e) {
    e.preventDefault();
    const isEditing = Boolean(editingScreenId);

    if (isEditing) {
      // Editing only updates name/theater — seat layout is untouched since bookings may reference it
      const reset = await submitForm(
        "screen",
        `/screens/${editingScreenId}`,
        { name: screenForm.name, theater_id: screenForm.theater_id },
        { theater_id: "", name: "", rows: 5, seats_per_row: 8 },
        "put"
      );
      if (reset) {
        setScreenForm(reset);
        setEditingScreenId(null);
      }
      return;
    }

    const reset = await submitForm(
      "screen",
      "/screens",
      { ...screenForm, rows: Number(screenForm.rows), seats_per_row: Number(screenForm.seats_per_row) },
      { theater_id: "", name: "", rows: 5, seats_per_row: 8 }
    );
    if (reset) setScreenForm(reset);
  }

  function startEditingShowtime(showtime) {
    setEditingShowtimeId(showtime._id);
    setShowtimeForm({
      movie_id: showtime.movie_id?._id || showtime.movie_id || "",
      screen_id: showtime.screen_id?._id || showtime.screen_id || "",
      start_time: showtime.start_time ? showtime.start_time.slice(0, 16) : "",
      base_price: showtime.base_price ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditingShowtime() {
    setEditingShowtimeId(null);
    setShowtimeForm({ movie_id: "", screen_id: "", start_time: "", base_price: "" });
  }

  async function deleteShowtime(id) {
    if (!confirm("Delete this showtime? Existing bookings for it will NOT be cancelled automatically.")) return;
    try {
      await api.delete(`/showtimes/${id}`);
      refreshLists();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function handleShowtimeSubmit(e) {
    e.preventDefault();
    const isEditing = Boolean(editingShowtimeId);
    const endpoint = isEditing ? `/showtimes/${editingShowtimeId}` : "/showtimes";
    const method = isEditing ? "put" : "post";

    const reset = await submitForm(
      "showtime",
      endpoint,
      { ...showtimeForm, base_price: Number(showtimeForm.base_price) },
      { movie_id: "", screen_id: "", start_time: "", base_price: "" },
      method
    );
    if (reset) {
      setShowtimeForm(reset);
      setEditingShowtimeId(null);
    }
  }

  function StatusMessage({ forKey }) {
    const s = status[forKey];
    if (!s || s.type === "loading") return null;
    return <p className={`admin-status ${s.type}`}>{s.message}</p>;
  }

  if (authLoading) return null;
  if (!user || !user.is_admin) return <Navigate to="/" replace />;

  return (
    <div className="admin-page">
      <h1>Admin Panel</h1>
      <p className="admin-subtitle">Manage movies, theaters, screens, and showtimes</p>

      <div className="admin-tabs">
        {[
          { key: "movies", label: `Movies (${movies.length})` },
          { key: "theaters", label: `Theaters (${theaters.length})` },
          { key: "screens", label: `Screens (${screens.length})` },
          { key: "showtimes", label: `Showtimes (${showtimes.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "movies" && (
      <div className="admin-section-grid">
        <form className="admin-card" onSubmit={handleMovieSubmit}>
          <h2>{editingMovieId ? "Edit Movie" : "Add Movie"}</h2>
          <input
            placeholder="Title"
            value={movieForm.title}
            onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            value={movieForm.description}
            onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Duration (mins)"
            value={movieForm.duration_mins}
            onChange={(e) => setMovieForm({ ...movieForm, duration_mins: e.target.value })}
            required
          />
          <input
            placeholder="Language"
            value={movieForm.language}
            onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
            required
          />
          <input
            placeholder="Genre"
            value={movieForm.genre}
            onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
          />
          <input
            placeholder="Poster URL"
            value={movieForm.poster_url}
            onChange={(e) => setMovieForm({ ...movieForm, poster_url: e.target.value })}
          />
          <input
            type="date"
            value={movieForm.release_date}
            onChange={(e) => setMovieForm({ ...movieForm, release_date: e.target.value })}
          />
          <input
            placeholder="Trailer URL (YouTube)"
            value={movieForm.trailer_url}
            onChange={(e) => setMovieForm({ ...movieForm, trailer_url: e.target.value })}
          />
          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            placeholder="Rating (e.g. 8.6)"
            value={movieForm.rating}
            onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
          />
          <textarea
            placeholder={"Cast, one per line:\nActor Name - Role"}
            value={movieForm.cast}
            onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value })}
          />
          <button type="submit">{editingMovieId ? "Update Movie" : "Add Movie"}</button>
          {editingMovieId && (
            <button type="button" className="admin-cancel-btn" onClick={cancelEditingMovie}>
              Cancel Edit
            </button>
          )}
          <StatusMessage forKey="movie" />
        </form>

        <div className="admin-card admin-list-card">
          <h2>Existing Movies ({movies.length})</h2>
          <div className="admin-list">
            {movies.map((m) => (
              <div className="admin-list-item" key={m._id}>
                <span className="admin-list-title">{m.title}</span>
                <span className="admin-list-meta">
                  {m.language} · {m.duration_mins} min
                </span>
                <div className="admin-list-actions">
                  <button type="button" onClick={() => startEditingMovie(m)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => deleteMovie(m._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {movies.length === 0 && <p className="admin-hint">No movies yet.</p>}
          </div>
        </div>
      </div>
      )}

      {activeTab === "theaters" && (
      <div className="admin-section-grid">
        <form className="admin-card" onSubmit={handleTheaterSubmit}>
          <h2>{editingTheaterId ? "Edit Theater" : "Add Theater"}</h2>
          <input
            placeholder="Name"
            value={theaterForm.name}
            onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })}
            required
          />
          <input
            placeholder="City"
            value={theaterForm.city}
            onChange={(e) => setTheaterForm({ ...theaterForm, city: e.target.value })}
            required
          />
          <input
            placeholder="Address"
            value={theaterForm.address}
            onChange={(e) => setTheaterForm({ ...theaterForm, address: e.target.value })}
          />
          <button type="submit">{editingTheaterId ? "Update Theater" : "Add Theater"}</button>
          {editingTheaterId && (
            <button type="button" className="admin-cancel-btn" onClick={cancelEditingTheater}>
              Cancel Edit
            </button>
          )}
          <StatusMessage forKey="theater" />
        </form>

        <div className="admin-card admin-list-card">
          <h2>Existing Theaters ({theaters.length})</h2>
          <div className="admin-list">
            {theaters.map((t) => (
              <div className="admin-list-item" key={t._id}>
                <span className="admin-list-title">{t.name}</span>
                <span className="admin-list-meta">{t.city}</span>
                <div className="admin-list-actions">
                  <button type="button" onClick={() => startEditingTheater(t)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => deleteTheater(t._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {theaters.length === 0 && <p className="admin-hint">No theaters yet.</p>}
          </div>
        </div>
      </div>
      )}

      {activeTab === "screens" && (
      <div className="admin-section-grid">
        <form className="admin-card" onSubmit={handleScreenSubmit}>
          <h2>{editingScreenId ? "Edit Screen" : "Add Screen"}</h2>
          <select
            value={screenForm.theater_id}
            onChange={(e) => setScreenForm({ ...screenForm, theater_id: e.target.value })}
            required
          >
            <option value="">Select theater…</option>
            {theaters.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
          <input
            placeholder="Screen name (e.g. Screen 2)"
            value={screenForm.name}
            onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
            required
          />
          {!editingScreenId && (
            <div className="admin-row">
              <input
                type="number"
                placeholder="Rows"
                value={screenForm.rows}
                onChange={(e) => setScreenForm({ ...screenForm, rows: e.target.value })}
                min="1"
              />
              <input
                type="number"
                placeholder="Seats per row"
                value={screenForm.seats_per_row}
                onChange={(e) => setScreenForm({ ...screenForm, seats_per_row: e.target.value })}
                min="1"
              />
            </div>
          )}
          <p className="admin-hint">
            {editingScreenId
              ? "Editing only updates the name/theater — seat layout stays as-is."
              : "Seats are auto-generated. Last row = Recliner, next 2 = Premium."}
          </p>
          <button type="submit">{editingScreenId ? "Update Screen" : "Add Screen"}</button>
          {editingScreenId && (
            <button type="button" className="admin-cancel-btn" onClick={cancelEditingScreen}>
              Cancel Edit
            </button>
          )}
          <StatusMessage forKey="screen" />
        </form>

        <div className="admin-card admin-list-card">
          <h2>Existing Screens ({screens.length})</h2>
          <div className="admin-list">
            {screens.map((s) => (
              <div className="admin-list-item" key={s._id}>
                <span className="admin-list-title">{s.name}</span>
                <span className="admin-list-meta">{s.total_seats} seats</span>
                <div className="admin-list-actions">
                  <button type="button" onClick={() => startEditingScreen(s)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => deleteScreen(s._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {screens.length === 0 && <p className="admin-hint">No screens yet.</p>}
          </div>
        </div>
      </div>
      )}

      {activeTab === "showtimes" && (
      <div className="admin-section-grid">
        <form className="admin-card" onSubmit={handleShowtimeSubmit}>
          <h2>{editingShowtimeId ? "Edit Showtime" : "Add Showtime"}</h2>
          <select
            value={showtimeForm.movie_id}
            onChange={(e) => setShowtimeForm({ ...showtimeForm, movie_id: e.target.value })}
            required
          >
            <option value="">Select movie…</option>
            {movies.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title}
              </option>
            ))}
          </select>
          <select
            value={showtimeForm.screen_id}
            onChange={(e) => setShowtimeForm({ ...showtimeForm, screen_id: e.target.value })}
            required
          >
            <option value="">Select screen…</option>
            {screens.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={showtimeForm.start_time}
            onChange={(e) => setShowtimeForm({ ...showtimeForm, start_time: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Base price (₹)"
            value={showtimeForm.base_price}
            onChange={(e) => setShowtimeForm({ ...showtimeForm, base_price: e.target.value })}
            required
          />
          <button type="submit">{editingShowtimeId ? "Update Showtime" : "Add Showtime"}</button>
          {editingShowtimeId && (
            <button type="button" className="admin-cancel-btn" onClick={cancelEditingShowtime}>
              Cancel Edit
            </button>
          )}
          <StatusMessage forKey="showtime" />
        </form>

        <div className="admin-card admin-list-card">
          <h2>Existing Showtimes ({showtimes.length})</h2>
          <div className="admin-list">
            {showtimes.map((s) => (
              <div className="admin-list-item" key={s._id}>
                <span className="admin-list-title">{s.movie_id?.title || "Unknown movie"}</span>
                <span className="admin-list-meta">
                  {s.screen_id?.name} ·{" "}
                  {s.start_time &&
                    new Date(s.start_time).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                </span>
                <div className="admin-list-actions">
                  <button type="button" onClick={() => startEditingShowtime(s)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => deleteShowtime(s._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {showtimes.length === 0 && <p className="admin-hint">No showtimes yet.</p>}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default Admin;