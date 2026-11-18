import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import BudgetTab from "../components/BudgetTab.jsx";
import ConfirmButton from "../components/ConfirmButton.jsx";
import ItineraryTab from "../components/ItineraryTab.jsx";
import { ComingSoon, ErrorMessage, Loading } from "../components/StatusMessage.jsx";
import TripForm from "../components/TripForm.jsx";
import { useLoad } from "../hooks.js";
import { formatDate } from "../utils.js";

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: trip, error, loading, reload } = useLoad(() => api.get(`/trips/${tripId}`), [tripId]);
  const [tab, setTab] = useState("itinerary");
  const [editing, setEditing] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  if (loading && !trip) return <Loading />;
  if (error) {
    return (
      <main>
        <ErrorMessage message={error} onRetry={reload} />
        <p><Link to="/trips">Back to my trips</Link></p>
      </main>
    );
  }

  async function handleDelete() {
    try {
      await api.del(`/trips/${trip.id}`);
      navigate("/trips");
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  return (
    <main>
      <p><Link to="/trips">&larr; All trips</Link></p>
      {editing ? (
        <TripForm initial={trip} submitLabel="Save changes" onCancel={() => setEditing(false)}
          onSubmit={async (payload) => { await api.patch(`/trips/${trip.id}`, payload); setEditing(false); reload(); }} />
      ) : (
        <div className="row between">
          <div>
            <h1>{trip.title}</h1>
            <p className="muted">{trip.destination} · {formatDate(trip.start_date)} - {formatDate(trip.end_date)}</p>
            {trip.notes && <p>{trip.notes}</p>}
          </div>
          <div className="row">
            <ComingSoon>Share trip</ComingSoon>
            <button className="btn small" onClick={() => setEditing(true)}>Edit trip</button>
            <ConfirmButton label="Delete trip" onConfirm={handleDelete}>Delete trip</ConfirmButton>
          </div>
        </div>
      )}
      <ErrorMessage message={deleteError} />

      <div className="tabs" role="tablist">
        {[["itinerary", "Itinerary"], ["budget", "Budget"]].map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key}
                  className={tab === key ? "tab active" : "tab"} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "itinerary" ? <ItineraryTab trip={trip} /> : <BudgetTab trip={trip} />}
    </main>
  );
}
