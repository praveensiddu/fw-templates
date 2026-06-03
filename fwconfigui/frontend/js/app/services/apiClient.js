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

function withTimeout(fetchOptions, timeoutMs) {
  const ms = Number(timeoutMs);
  if (!Number.isFinite(ms) || ms <= 0) {
    return { options: fetchOptions || {}, cancel: () => {} };
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  const options = { ...(fetchOptions || {}), signal: controller.signal };
  return {
    options,
    cancel: () => clearTimeout(id),
  };
}

function isAbortError(e) {
  return e && (e.name === "AbortError" || String(e.message || "").toLowerCase().includes("aborted"));
}

async function fetchJson(url, opts) {
  const timeoutMs = opts && Number.isFinite(Number(opts.timeoutMs)) ? Number(opts.timeoutMs) : 120000;
  const { options, cancel } = withTimeout({ headers: { Accept: "application/json" } }, timeoutMs);
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    cancel();
    if (isAbortError(e)) {
      const err = new Error("Request timed out (504 Gateway Timeout). The server didn’t respond in time.");
      err.status = 504;
      throw err;
    }
    throw e;
  }
  if (!res.ok) {
    cancel();
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  cancel();
  return await res.json();
}

async function deleteJson(url, body, opts) {
  const timeoutMs = opts && Number.isFinite(Number(opts.timeoutMs)) ? Number(opts.timeoutMs) : 120000;
  const hasBody = body !== undefined && body !== null;
  const { options, cancel } = withTimeout(
    {
      method: "DELETE",
      headers: hasBody
        ? { Accept: "application/json", "Content-Type": "application/json" }
        : { Accept: "application/json" },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    },
    timeoutMs
  );

  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    cancel();
    if (isAbortError(e)) {
      const err = new Error("Request timed out (504 Gateway Timeout). The server didn’t respond in time.");
      err.status = 504;
      throw err;
    }
    throw e;
  }
  if (!res.ok) {
    cancel();
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  cancel();
  return await res.json();
}

async function postJson(url, body, opts) {
  const timeoutMs = opts && Number.isFinite(Number(opts.timeoutMs)) ? Number(opts.timeoutMs) : 120000;
  const { options, cancel } = withTimeout(
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    },
    timeoutMs
  );

  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    cancel();
    if (isAbortError(e)) {
      const err = new Error("Request timed out (504 Gateway Timeout). The server didn’t respond in time.");
      err.status = 504;
      throw err;
    }
    throw e;
  }
  if (!res.ok) {
    cancel();
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  cancel();
  return await res.json();
}

async function putJson(url, body, opts) {
  const timeoutMs = opts && Number.isFinite(Number(opts.timeoutMs)) ? Number(opts.timeoutMs) : 120000;
  const { options, cancel } = withTimeout(
    {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    },
    timeoutMs
  );

  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    cancel();
    if (isAbortError(e)) {
      const err = new Error("Request timed out (504 Gateway Timeout). The server didn’t respond in time.");
      err.status = 504;
      throw err;
    }
    throw e;
  }
  if (!res.ok) {
    cancel();
    const info = await readErrorMessage(res);
    const err = new Error(info.message);
    err.status = info.status;
    err.body = info.body;
    err.rawText = info.rawText;
    throw err;
  }
  cancel();
  return await res.json();
}
