/**
 * Access request API helpers.
 */

async function listAccessRequests() {
  const resp = await fetchJson("/api/v1/access_requests");
  return Array.isArray(resp) ? resp : [];
}

async function requestProductAccess(payload) {
  return await postJson("/api/v1/product_access", payload || {});
}

async function requestGlobalAccess(payload) {
  return await postJson("/api/v1/global_access", payload || {});
}
