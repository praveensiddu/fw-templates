/**
 * API Client - Network helpers for making HTTP requests.
 */

async function readErrorMessage(res) {
  try {
    const rawText = await res.text();
    const status = res.status;
    if (!rawText) return { message: `HTTP ${status}`, status, body: null, rawText: "" };

    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed.detail === "string") return { message: parsed.detail, status, body: parsed, rawText };
      if (parsed && typeof parsed.detail === "object" && parsed.detail.message) {
        return { message: parsed.detail.message, status, body: parsed, rawText };
      }
      if (parsed && typeof parsed.message === "string") return { message: parsed.message, status, body: parsed, rawText };
      return { message: rawText, status, body: parsed, rawText };
    } catch {
      return { message: rawText, status, body: rawText, rawText };
    }
  } catch {
    return { message: `HTTP ${res.status}`, status: res.status, body: null, rawText: "" };
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  return await res.json();
}

async function deleteJson(url, body) {
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  return await res.json();
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  return await res.json();
}

async function putJson(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  return await res.json();
}
