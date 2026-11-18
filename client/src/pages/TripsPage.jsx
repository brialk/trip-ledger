import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import BudgetBar from "../components/BudgetBar.jsx";
import { Empty, ErrorMessage, Loading } from "../components/StatusMessage.jsx";
import TripForm from "../components/TripForm.jsx";
import { useLoad } from "../hooks.js";
import { formatDate, formatMoney } from "../utils.js";

export default function TripsPage() {
  const { data: trips, error, loading, reload } = useLoad(() => api.get("/trips"));
  const [creating, setCreating] = useState(false);

  async function createTrip(payload) {
    await api.post("/trips", payload);
    setCreating(false);
    reload();
  }

  return (
    <main>
      <div className="row between">
        <div>
          <h1>My trips</h1>
          <p className="muted">Plan the days, track the spending.</p>
        </div>
        {!creating && <button className="btn primary" onClick={() => setCreating(true)}>+ New trip</button>}
      </div>

      {creating && <TripForm submitLabel="Create trip" onSubmit={createTrip} onCancel={() => setCreating(false)} />}

      {loading && !trips && <Loading />}
      <ErrorMessage message={error} onRetry={reload} />
      {trips && trips.length === 0 && !creating && (
        <Empty>No trips yet. Click "New trip" to plan your first one.</Empty>
      )}

      <div className="stack">
        {trips?.map((t) => (
          <Link key={t.id} to={`/trips/${t.id}`} className="card trip-card">
            <div className="row between">
              <strong>{t.title}</strong>
              <span className={`badge ${t.spent_cents > t.budget_cents ? "over" : "ok"}`}>
                {t.spent_cents > t.budget_cents ? "Over budget" : "On budget"}
              </span>
            </div>
            <div className="muted">{t.destination} · {formatDate(t.start_date)} - {formatDate(t.end_date)}</div>
            <BudgetBar spent={t.spent_cents} budget={t.budget_cents} />
            <div className="muted small-text">
              {formatMoney(t.spent_cents, t.currency)} of {formatMoney(t.budget_cents, t.currency)} spent
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
