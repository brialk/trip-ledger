import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ErrorMessage, Loading } from "./components/StatusMessage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AuthForm from "./pages/AuthForm.jsx";
import NotFound from "./pages/NotFound.jsx";
import TripDetail from "./pages/TripDetail.jsx";
import TripsPage from "./pages/TripsPage.jsx";

export default function App() {
  const { loading, startupError } = useAuth();
  return (
    <>
      <Navbar />
      {startupError && <div className="wrap"><ErrorMessage message={startupError} onRetry={() => window.location.reload()} /></div>}
      {loading ? (
        <Loading />
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/trips" replace />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/trips" element={<ProtectedRoute><TripsPage /></ProtectedRoute>} />
          <Route path="/trips/:tripId" element={<ProtectedRoute><TripDetail /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </>
  );
}
