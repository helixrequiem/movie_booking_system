import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        Book Your Show
      </Link>

      <div className="header-right">
        {user ? (
          <>
            {user.is_admin && (
              <Link to="/admin" className="header-link">
                Admin
              </Link>
            )}
            <Link to="/my-bookings" className="header-link">
              My Bookings
            </Link>
            <span className="greeting">Hi, {user.name.split(" ")[0]}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="header-link">
              Log in
            </Link>
            <Link to="/register" className="header-link primary">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;