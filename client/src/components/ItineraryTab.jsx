import { useState } from "react";
import { api } from "../api.js";
import { useLoad } from "../hooks.js";
import { formatDay, titleCase } from "../utils.js";
import ConfirmButton from "./ConfirmButton.jsx";
import ItemForm from "./ItemForm.jsx";
import { ComingSoon, Empty, ErrorMessage, Loading } from "./StatusMessage.jsx";

export default function ItineraryTab({ trip }) {
  const base = `/trips/${trip.id}/items`;
  const { data: items, error, loading, reload } = useLoad(() => api.get(base), [trip.id]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState("");

  async function run(fn) {
    setActionError("");
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  // Group the (already sorted) items by day
  const days = [];
  for (const item of items ?? []) {
    const last = days[days.length - 1];
    if (last && last.date === item.item_date) last.items.push(item);
    else days.push({ date: item.item_date, items: [item] });
  }

  return (
    <section>
      <div className="row between">
        <h2>Itinerary</h2>
        <div className="row">
          <ComingSoon>Drag to reorder</ComingSoon>
          {!adding && <button className="btn small primary" onClick={() => setAdding(true)}>+ Add activity</button>}
        </div>
      </div>

      {adding && (
        <ItemForm trip={trip} onCancel={() => setAdding(false)}
          onSubmit={async (f) => { await api.post(base, f); setAdding(false); reload(); }} />
      )}
      <ErrorMessage message={actionError} />
      {loading && !items && <Loading />}
      <ErrorMessage message={error} onRetry={reload} />
      {items && items.length === 0 && !adding && <Empty>Nothing planned yet. Add your first activity.</Empty>}

      {days.map((day) => (
        <div key={day.date} className="day">
          <h3>{formatDay(day.date)}</h3>
          {day.items.map((item) =>
            editingId === item.id ? (
              <ItemForm key={item.id} trip={trip} initial={item} onCancel={() => setEditingId(null)}
                onSubmit={async (f) => { await api.patch(`${base}/${item.id}`, f); setEditingId(null); reload(); }} />
            ) : (
              <div key={item.id} className="card item">
                <div className="item-main">
                  <strong>{item.start_time && <span className="time">{item.start_time}</span>}{item.title}</strong>
                  <div className="muted small-text">
                    <span className="badge">{titleCase(item.category)}</span>{" "}
                    {item.location && <>{item.location} · </>}
                    {item.notes}
                  </div>
                </div>
                <div className="row">
                  <label className="check small-text">
                    <input type="checkbox" checked={item.booked}
                      onChange={(e) => run(() => api.patch(`${base}/${item.id}`, { booked: e.target.checked }))} />
                    Booked
                  </label>
                  <button className="btn small" onClick={() => setEditingId(item.id)}>Edit</button>
                  <ConfirmButton label={`Delete ${item.title}`} onConfirm={() => run(() => api.del(`${base}/${item.id}`))} />
                </div>
              </div>
            )
          )}
        </div>
      ))}
    </section>
  );
}
