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
  const status = Number(e.status);
  const msg = safeTrim(e.message);
  const msgLc = msg.toLowerCase();
  if (status === 504 || msgLc.includes("504") || msgLc.includes("gateway timeout") || msgLc.includes("didn't respond in time")) {
    return "Request timed out (504 Gateway Timeout). The server didn’t respond in time. Please try again or reduce the scope.";
  }
  if (msg) return msg;
  return String(e);
}

function deepClone(v) {
  try {
    return JSON.parse(JSON.stringify(v));
  } catch {
    return v;
  }
}
