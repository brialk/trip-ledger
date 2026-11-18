// Money is stored as whole cents on the server (no rounding bugs).
// These helpers convert to and from what people type and read.

export function formatMoney(cents, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

// "12.5" -> 1250.  Returns null if it isn't a valid amount.
export function dollarsToCents(text) {
  const clean = String(text).trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(parseFloat(clean) * 100);
}

// 1250 -> "12.50"
export function centsToDollars(cents) {
  return (cents / 100).toFixed(2);
}

// "2027-05-01" -> "May 1, 2027"  (parsed by hand so time zones can't shift the day)
export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
