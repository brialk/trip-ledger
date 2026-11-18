// One place that talks to the backend. Every page uses api.get / api.post / ...
// so error handling is identical everywhere.

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = () => {};
// AuthContext registers a function here so a surprise 401 (session expired)
// sends the person back to the login screen.
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0);
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON (for example the dev proxy failing) */
  }

  if (!res.ok) {
    const isAuthForm = path === "/login" || path === "/signup";
    if (res.status === 401 && !isAuthForm) onUnauthorized();
    const fallback =
      res.status >= 500
        ? "The server isn't responding. Is the backend running?"
        : `Request failed (${res.status}).`;
    throw new ApiError(data?.error || fallback, res.status);
  }
  return data;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body ?? {}),
  patch: (path, body) => request("PATCH", path, body ?? {}),
  del: (path) => request("DELETE", path),
};
