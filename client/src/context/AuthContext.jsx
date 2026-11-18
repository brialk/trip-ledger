import { createContext, useContext, useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until check_session answers
  const [startupError, setStartupError] = useState("");

  useEffect(() => {
    // Am I already logged in? (the browser keeps the cookie)
    api
      .get("/check_session")
      .then((data) => setUser(data.user))
      .catch((err) => setStartupError(err.message))
      .finally(() => setLoading(false));
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  async function login(username, password) {
    const data = await api.post("/login", { username, password });
    setUser(data.user);
  }
  async function signup(username, password) {
    const data = await api.post("/signup", { username, password });
    setUser(data.user);
  }
  async function logout() {
    try {
      await api.del("/logout");
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, startupError, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
