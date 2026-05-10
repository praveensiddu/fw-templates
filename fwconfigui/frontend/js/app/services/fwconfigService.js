/**
 * fwconfigService - API calls for fwconfig YAML types.
 */

function fwconfigTypeBasePath(type) {
  const t = safeTrim(type);
  if (!t) return "";
  if (
    t === "keywords" ||
    t === "rule-files" ||
    t === "networkareas" ||
    t === "sites" ||
    t === "port-protocol" ||
    t === "env" ||
    t === "business-purpose" ||
    t === "fw-rules"
  ) {
    return `/api/v1/fwconfig/${encodeURIComponent(t)}`;
  }
  return "";
}

async function listFwConfigItems(type) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const base = fwconfigTypeBasePath(t);
  if (base) return await fetchJson(base);
  return await fetchJson(`/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`);
}

async function listFwConfigFiles(type) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const base = fwconfigTypeBasePath(t);
  if (base) return await fetchJson(`${base}/files`);
  return await fetchJson(`/api/v1/fwconfig/files?type=${encodeURIComponent(t)}`);
}

async function saveFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const name = safeTrim(payload?.name);
  const filename = safeTrim(payload?.filename);
  const originalName = safeTrim(payload?.original_name);
  if (!filename) throw new Error("filename is required");
  if (!name) throw new Error("name is required");
  const base = fwconfigTypeBasePath(t);
  const url = base ? base : `/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`;
  return await postJson(url, {
    filename,
    name,
    original_name: originalName || undefined,
    data: payload?.data || {},
  });
}

async function deleteFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const name = safeTrim(payload?.name);
  const filename = safeTrim(payload?.filename);
  if (!filename) throw new Error("filename is required");
  if (!name) throw new Error("name is required");
  const base = fwconfigTypeBasePath(t);
  const url = base ? base : `/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`;
  return await deleteJson(url, { filename, name });
}
