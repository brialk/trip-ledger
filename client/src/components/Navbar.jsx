import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to={user ? "/trips" : "/login"} className="brand">TripLedger</Link>
      <nav>
        {user ? (
          <>
            <span className="who">Hi, {user.username}</span>
            <button className="btn small" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="btn small primary">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
