import { useState } from "react";
import { useOptions } from "../hooks.js";
import { centsToDollars, dollarsToCents } from "../utils.js";
import { ErrorMessage } from "./StatusMessage.jsx";

// Used for both "new trip" and "edit trip".
export default function TripForm({ initial, submitLabel, onSubmit, onCancel }) {
  const { currencies } = useOptions();
  const [f, setF] = useState({
    title: initial?.title ?? "",
    destination: initial?.destination ?? "",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    budget: initial ? centsToDollars(initial.budget_cents) : "",
    currency: initial?.currency ?? "USD",
    notes: initial?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const cents = dollarsToCents(f.budget);
    if (cents === null) return setError("Budget must be an amount like 1500 or 1500.50.");
    if (f.end_date < f.start_date) return setError("End date can't be before the start date.");
    setBusy(true);
    try {
      await onSubmit({
        title: f.title, destination: f.destination, start_date: f.start_date,
        end_date: f.end_date, budget_cents: cents, currency: f.currency, notes: f.notes,
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="grid2">
        <label>Trip name<input value={f.title} onChange={set("title")} maxLength={120} required /></label>
        <label>Destination<input value={f.destination} onChange={set("destination")} maxLength={120} required /></label>
        <label>Start date<input type="date" value={f.start_date} onChange={set("start_date")} required /></label>
        <label>End date<input type="date" value={f.end_date} min={f.start_date} onChange={set("end_date")} required /></label>
        <label>Budget<input inputMode="decimal" placeholder="1500.00" value={f.budget} onChange={set("budget")} required /></label>
        <label>Currency label
          <select value={f.currency} onChange={set("currency")}>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <label>Notes (optional)<textarea rows={2} maxLength={500} value={f.notes} onChange={set("notes")} /></label>
      <ErrorMessage message={error} />
      <div className="row">
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
