/**
 * fwconfigService - API calls for fwconfig YAML types.
 */

async function listFwConfigItems(type) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  return await fetchJson(`/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`);
}

async function listFwConfigFiles(type) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  return await fetchJson(`/api/v1/fwconfig/files?type=${encodeURIComponent(t)}`);
}

async function saveFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  const name = safeTrim(payload?.name);
  const filename = safeTrim(payload?.filename);
  if (!filename) throw new Error("filename is required");
  if (!name) throw new Error("name is required");
  return await postJson(`/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`, {
    filename,
    name,
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
  return await deleteJson(`/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`, { filename, name });
}
