import { useState } from "react";
import { api } from "../api.js";
import { useLoad } from "../hooks.js";
import { formatDate, formatMoney, titleCase } from "../utils.js";
import BudgetBar from "./BudgetBar.jsx";
import ConfirmButton from "./ConfirmButton.jsx";
import ExpenseForm from "./ExpenseForm.jsx";
import { ComingSoon, Empty, ErrorMessage, Loading } from "./StatusMessage.jsx";

export default function BudgetTab({ trip }) {
  const base = `/trips/${trip.id}`;
  // Load the summary and the expense list together
  const { data, error, loading, reload } = useLoad(
    async () => {
      const [summary, expenses] = await Promise.all([api.get(`${base}/summary`), api.get(`${base}/expenses`)]);
      return { summary, expenses };
    },
    [trip.id, trip.budget_cents]
  );
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const money = (c) => formatMoney(c, trip.currency);

  async function run(fn) {
    setActionError("");
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  const s = data?.summary;
  return (
    <section>
      <div className="row between">
        <h2>Budget</h2>
        <div className="row">
          <ComingSoon>Convert currencies</ComingSoon>
          {!adding && <button className="btn small primary" onClick={() => setAdding(true)}>+ Add expense</button>}
        </div>
      </div>

      {loading && !data && <Loading />}
      <ErrorMessage message={error} onRetry={reload} />

      {s && (
        <div className="card summary">
          <div className="stats">
            <div><span className="muted small-text">Budget</span><strong>{money(s.budget_cents)}</strong></div>
            <div><span className="muted small-text">Spent</span><strong>{money(s.spent_cents)}</strong></div>
            <div>
              <span className="muted small-text">{s.over_budget ? "Over by" : "Left"}</span>
              <strong className={s.over_budget ? "bad" : "good"}>{money(Math.abs(s.remaining_cents))}</strong>
            </div>
          </div>
          <BudgetBar spent={s.spent_cents} budget={s.budget_cents} />
          {s.over_budget && <p className="bad small-text">You're over budget for this trip.</p>}
          <ul className="cats">
            {Object.entries(s.by_category).filter(([, v]) => v > 0).map(([cat, v]) => (
              <li key={cat}><span>{titleCase(cat)}</span><span>{money(v)}</span></li>
            ))}
          </ul>
        </div>
      )}

      {adding && (
        <ExpenseForm trip={trip} onCancel={() => setAdding(false)}
          onSubmit={async (f) => { await api.post(`${base}/expenses`, f); setAdding(false); reload(); }} />
      )}
      <ErrorMessage message={actionError} />
      {data && data.expenses.length === 0 && !adding && <Empty>No expenses yet. Add one to start tracking.</Empty>}

      {data?.expenses.map((e) =>
        editingId === e.id ? (
          <ExpenseForm key={e.id} trip={trip} initial={e} onCancel={() => setEditingId(null)}
            onSubmit={async (f) => { await api.patch(`${base}/expenses/${e.id}`, f); setEditingId(null); reload(); }} />
        ) : (
          <div key={e.id} className="card item">
            <div className="item-main">
              <strong>{e.description}</strong>
              <div className="muted small-text"><span className="badge">{titleCase(e.category)}</span> {formatDate(e.spent_on)}</div>
            </div>
            <div className="row">
              <strong>{money(e.amount_cents)}</strong>
              <button className="btn small" onClick={() => setEditingId(e.id)}>Edit</button>
              <ConfirmButton label={`Delete ${e.description}`} onConfirm={() => run(() => api.del(`${base}/expenses/${e.id}`))} />
            </div>
          </div>
        )
      )}
    </section>
  );
}
