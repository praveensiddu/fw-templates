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
    t === "products" ||
    t === "components" ||
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

async function saveFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const name = safeTrim(payload?.name);
  const originalName = safeTrim(payload?.original_name);
  if (!name) throw new Error("name is required");
  const base = fwconfigTypeBasePath(t);
  const url = base ? base : `/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`;

  const nextData = { ...(payload?.data || {}) };
  if (safeTrim(nextData?.name) && safeTrim(nextData?.name) === name) {
    delete nextData.name;
  }

  const body = {
    name,
    original_name: originalName || undefined,
    ...(Object.keys(nextData).length ? { data: nextData } : {}),
  };

  return await postJson(url, body);
}

async function deleteFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const name = safeTrim(payload?.name);
  if (!name) throw new Error("name is required");
  const base = fwconfigTypeBasePath(t);
  const url = base ? base : `/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`;
  return await deleteJson(url, { name });
}
