import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";

// Runs an async function when the component appears (and when `deps` change).
// Gives back { data, error, loading, reload }.
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: "", loading: true });
  const latest = useRef(0);

  const run = useCallback(() => {
    const id = ++latest.current; // ignore answers that arrive late
    setState((s) => ({ ...s, loading: true, error: "" }));
    loader()
      .then((data) => id === latest.current && setState({ data, error: "", loading: false }))
      .catch((err) =>
        id === latest.current && setState({ data: null, error: err.message, loading: false })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { ...state, reload: run };
}

// Dropdown choices (categories, currencies) are fetched once and remembered.
let optionsPromise = null;
export function useOptions() {
  const [options, setOptions] = useState({ categories: [], currencies: ["USD"] });
  useEffect(() => {
    optionsPromise ??= api.get("/options");
    optionsPromise.then(setOptions).catch(() => {
      optionsPromise = null;
    });
  }, []);
  return options;
}
