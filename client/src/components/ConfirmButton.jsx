import { useState } from "react";

// Two-step delete: first click asks "Sure?", second click really deletes.
export default function ConfirmButton({ onConfirm, children = "Delete", label }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button className="btn small danger-outline" onClick={() => setAsking(true)} aria-label={label}>
        {children}
      </button>
    );
  }
  return (
    <span className="confirm">
      <button className="btn small danger" onClick={() => { setAsking(false); onConfirm(); }}>
        Yes, delete
      </button>
      <button className="btn small" onClick={() => setAsking(false)}>Cancel</button>
    </span>
  );
}
