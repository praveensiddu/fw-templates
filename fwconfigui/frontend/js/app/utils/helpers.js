/**
 * helpers - shared utilities.
 */

function safeTrim(v) {
  return String(v ?? "").trim();
}

function isNonEmptyString(v) {
  return safeTrim(v).length > 0;
}

function formatError(e) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e.message) return e.message;
  return String(e);
}

function deepClone(v) {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}
