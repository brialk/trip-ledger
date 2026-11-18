import { useState } from "react";
import { useOptions } from "../hooks.js";
import { titleCase } from "../utils.js";
import { ErrorMessage } from "./StatusMessage.jsx";

export default function ItemForm({ trip, initial, onSubmit, onCancel }) {
  const { categories } = useOptions();
  const [f, setF] = useState({
    item_date: initial?.item_date ?? trip.start_date,
    start_time: initial?.start_time ?? "",
    title: initial?.title ?? "",
    category: initial?.category ?? "activities",
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
    booked: initial?.booked ?? false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="grid2">
        <label>What<input value={f.title} onChange={set("title")} maxLength={120} required /></label>
        <label>Category
          <select value={f.category} onChange={set("category")}>
            {categories.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>
        <label>Date
          <input type="date" value={f.item_date} min={trip.start_date} max={trip.end_date}
                 onChange={set("item_date")} required />
        </label>
        <label>Time (optional)<input type="time" value={f.start_time ?? ""} onChange={set("start_time")} /></label>
        <label>Where (optional)<input value={f.location} onChange={set("location")} maxLength={120} /></label>
        <label className="check">
          <input type="checkbox" checked={f.booked} onChange={(e) => setF({ ...f, booked: e.target.checked })} />
          Already booked
        </label>
      </div>
      <label>Notes (optional)<textarea rows={2} maxLength={500} value={f.notes} onChange={set("notes")} /></label>
      <ErrorMessage message={error} />
      <div className="row">
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : initial ? "Save changes" : "Add to itinerary"}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
