import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/StatusMessage.jsx";

// One form used by both the Login and Signup pages.
export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/trips" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (isSignup && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await (isSignup ? signup : login)(username, password);
      navigate(location.state?.from || "/trips", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="narrow">
      <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="muted">
        {isSignup ? "Plan trips and keep spending on budget." : "Log in to see your trips."}
      </p>
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)}
                 autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete={isSignup ? "new-password" : "current-password"} required />
          {isSignup && <small className="muted">At least 8 characters.</small>}
        </label>
        <ErrorMessage message={error} />
        <button className="btn primary" disabled={busy}>
          {busy ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>
      <p className="muted center">
        {isSignup ? (
          <>Already have an account? <Link to="/login">Log in</Link></>
        ) : (
          <>New here? <Link to="/signup">Create an account</Link></>
        )}
      </p>
    </main>
  );
}
