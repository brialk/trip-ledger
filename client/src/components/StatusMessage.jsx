export function Loading({ text = "Loading..." }) {
  return <p className="status" role="status">{text}</p>;
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert" role="alert">
      <span>{message}</span>
      {onRetry && <button className="btn small" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>;
}

// A feature that is planned but not built yet. Marked clearly so nobody thinks it's a bug.
export function ComingSoon({ children }) {
  return (
    <button className="btn small" disabled title="Planned for version 2">
      {children} <span className="badge soon">v2</span>
    </button>
  );
}
