import { useState } from "react";
import { useOptions } from "../hooks.js";
import { centsToDollars, dollarsToCents, titleCase } from "../utils.js";
import { ErrorMessage } from "./StatusMessage.jsx";

export default function ExpenseForm({ trip, initial, onSubmit, onCancel }) {
  const { categories } = useOptions();
  const [f, setF] = useState({
    description: initial?.description ?? "",
    category: initial?.category ?? "food",
    amount: initial ? centsToDollars(initial.amount_cents) : "",
    spent_on: initial?.spent_on ?? trip.start_date,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const cents = dollarsToCents(f.amount);
    if (cents === null || cents < 1) return setError("Amount must be more than 0, like 12.50.");
    setBusy(true);
    try {
      await onSubmit({ description: f.description, category: f.category, amount_cents: cents, spent_on: f.spent_on });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="grid2">
        <label>What was it for?<input value={f.description} onChange={set("description")} maxLength={120} required /></label>
        <label>Amount ({trip.currency})<input inputMode="decimal" placeholder="12.50" value={f.amount} onChange={set("amount")} required /></label>
        <label>Category
          <select value={f.category} onChange={set("category")}>
            {categories.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>
        <label>Date<input type="date" value={f.spent_on} onChange={set("spent_on")} required /></label>
      </div>
      <ErrorMessage message={error} />
      <div className="row">
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : initial ? "Save changes" : "Add expense"}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
