// A simple progress bar: how much of the budget is spent.
export default function BudgetBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : spent > 0 ? 100 : 0;
  const over = spent > budget;
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
         aria-label="Budget used">
      <div className={`bar-fill${over ? " over" : ""}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
