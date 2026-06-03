/**
 * fwconfigService - API calls for fwconfig YAML types.
 */

function getCurrentProductFromPath() {
  const p = String(window?.location?.pathname || "");
  const m = p.match(/^\/products\/([^/]+)(?:\/|$)/);
  return m ? safeTrim(m[1]) : "";
}

function setCurrentProduct(product) {
  window.__fwCurrentProduct = safeTrim(product);
}

function getCurrentProduct() {
  const fromGlobal = safeTrim(window.__fwCurrentProduct);
  if (fromGlobal) return fromGlobal;
  const fromPath = getCurrentProductFromPath();
  if (fromPath) return fromPath;
  return "";
}

async function fetchProductRecord(productName) {
  const name = safeTrim(productName);
  if (!name) throw new Error("product name is required");
  const url = `/api/v1/fwconfig/products?name=${encodeURIComponent(name)}`;
  const resp = await fetchJson(url);
  const items = Array.isArray(resp?.items) ? resp.items : [];
  return items.length ? items[0] : null;
}

if (typeof window !== "undefined") {
  window.fetchProductRecord = fetchProductRecord;
}

function isProductScopedType(type) {
  const t = safeTrim(type);
  return (
    t === "keywords" ||
    t === "rule-files" ||
    t === "components" ||
    t === "port-protocol" ||
    t === "business-purpose" ||
    t === "fw-rules" ||
    t === "groups" ||
    t === "addrs" ||
    t === "ip_inventory"
  );
}

function fwconfigTypeBasePath(type) {
  const t = safeTrim(type);
  if (!t) return "";

  const product = getCurrentProduct();
  const hasProduct = isNonEmptyString(product);
  if (
    hasProduct &&
    (t === "keywords" ||
      t === "rule-files" ||
      t === "components" ||
      t === "port-protocol" ||
      t === "business-purpose" ||
      t === "fw-rules")
  ) {
    if (t === "keywords") return `/api/v1/products/${encodeURIComponent(product)}/keywords`;
    if (t === "rule-files") return `/api/v1/products/${encodeURIComponent(product)}/rule-files`;
    if (t === "components") return `/api/v1/products/${encodeURIComponent(product)}/components`;
    if (t === "port-protocol") return `/api/v1/products/${encodeURIComponent(product)}/port-protocol`;
    if (t === "business-purpose") return `/api/v1/products/${encodeURIComponent(product)}/business-purpose`;
    if (t === "fw-rules") return `/api/v1/products/${encodeURIComponent(product)}/rule-templates`;
    return `/api/v1/products/${encodeURIComponent(product)}/fwconfig/${encodeURIComponent(t)}`;
  }

  if (
    t === "networkareas" ||
    t === "sites" ||
    t === "products" ||
    t === "env" ||
    t === "keywords" ||
    t === "rule-files" ||
    t === "components" ||
    t === "port-protocol" ||
    t === "business-purpose" ||
    t === "fw-rules"
  ) {
    if (t === "env" || t === "networkareas" || t === "sites") {
      return `/api/v1/infra/${encodeURIComponent(t)}`;
    }
    return `/api/v1/fwconfig/${encodeURIComponent(t)}`;
  }
  return "";
}

async function listFwConfigItems(type) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  if (isProductScopedType(t) && !isNonEmptyString(getCurrentProduct())) {
    throw new Error("Select a product first");
  }
  const base = fwconfigTypeBasePath(t);
  if (base) return await fetchJson(base);
  return await fetchJson(`/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`);
}

async function saveFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  if (isProductScopedType(t) && !isNonEmptyString(getCurrentProduct())) {
    throw new Error("Select a product first");
  }
  const name = safeTrim(payload?.name);
  const originalName = safeTrim(payload?.original_name);
  if (!name) throw new Error("name is required");
  const base = fwconfigTypeBasePath(t);
  const url = base ? base : `/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`;

  const isUpdate = isNonEmptyString(originalName);
  if (t === "env" || t === "keywords") {
    const sep = url.includes("?") ? "&" : "?";
    return await postJson(`${url}${sep}name=${encodeURIComponent(name)}`);
  }

  const nextData = { ...(payload?.data || {}) };
  if (safeTrim(nextData?.name) && safeTrim(nextData?.name) === name) {
    delete nextData.name;
  }

  const body = {
    name,
    original_name: originalName || undefined,
    ...(Object.keys(nextData).length ? { data: nextData } : {}),
  };

  return isUpdate ? await putJson(url, body) : await postJson(url, body);
}

async function deleteFwConfigItem(type, payload) {
  const t = safeTrim(type);
  if (!t) throw new Error("type is required");
  if (isProductScopedType(t) && !isNonEmptyString(getCurrentProduct())) {
    throw new Error("Select a product first");
  }
  const name = safeTrim(payload?.name);
  if (!name) throw new Error("name is required");
  const base = fwconfigTypeBasePath(t);
  const url = base ? base : `/api/v1/fwconfig/items?type=${encodeURIComponent(t)}`;
  const sep = url.includes("?") ? "&" : "?";
  return await deleteJson(`${url}${sep}name=${encodeURIComponent(name)}`);
}

function requireEnv(env) {
  const e = safeTrim(env);
  if (!e) throw new Error("env is required");
  return e;
}

async function listGroups(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  return await fetchJson(`/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}`);
}

async function saveGroup(env, payload) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const name = safeTrim(payload?.name);
  const originalName = safeTrim(payload?.original_name);
  const filename = safeTrim(payload?.filename) || "groups.yaml";
  if (!name) throw new Error("name is required");

  const body = {
    name,
    original_name: originalName || undefined,
    ...(payload?.data ? { data: payload.data } : {}),
  };
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}?filename=${encodeURIComponent(filename)}`;
  return isNonEmptyString(originalName) ? await putJson(url, body) : await postJson(url, body);
}

async function deleteGroup(env, name, filename) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const fn = safeTrim(filename) || "groups.yaml";
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}?filename=${encodeURIComponent(fn)}&name=${encodeURIComponent(n)}`;
  return await deleteJson(url);
}

async function excludeGroupFromImport(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}/exclude`;
  return await postJson(url, { name: n });
}

async function excludeGroupFromEnvCommon(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}/exclude-common`;
  return await postJson(url, { name: n });
}

async function listAddrs(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  return await fetchJson(`/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}`);
}

async function saveAddr(env, payload) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const name = safeTrim(payload?.name);
  const originalName = safeTrim(payload?.original_name);
  const filename = safeTrim(payload?.filename) || "addresses.yaml";
  if (!name) throw new Error("name is required");

  const body = {
    name,
    original_name: originalName || undefined,
    ...(payload?.data ? { data: payload.data } : {}),
  };
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}?filename=${encodeURIComponent(filename)}`;
  return isNonEmptyString(originalName) ? await putJson(url, body) : await postJson(url, body);
}

async function deleteAddr(env, name, filename) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const fn = safeTrim(filename) || "addresses.yaml";
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}?filename=${encodeURIComponent(fn)}&name=${encodeURIComponent(n)}`;
  return await deleteJson(url);
}

async function excludeAddrFromImport(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}/exclude`;
  return await postJson(url, { name: n });
}

async function excludeAddrFromEnvCommon(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}/exclude-common`;
  return await postJson(url, { name: n });
}

async function checkAddrUsedInGroups(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}/check-used`;
  return await postJson(url, {});
}

async function checkGroupUsedInGroups(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}/check-used`;
  return await postJson(url, {});
}

async function getAddrUsedInGroups(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}/used-in-groups?name=${encodeURIComponent(n)}`;
  return await fetchJson(url);
}

async function getAddrUsedInRules(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}/used-in-rules?name=${encodeURIComponent(n)}`;
  return await fetchJson(url);
}

async function getAddrCleanupStrategyChoices(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const url = `/api/v1/products/${encodeURIComponent(product)}/addrs/${encodeURIComponent(e)}/cleanup-strategy-choices`;
  return await fetchJson(url);
}

async function getGroupUsedInGroups(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}/used-in-groups?name=${encodeURIComponent(n)}`;
  return await fetchJson(url);
}

async function getGroupUsedInRules(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}/used-in-rules?name=${encodeURIComponent(n)}`;
  return await fetchJson(url);
}

async function getGroupCleanupStrategyChoices(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const url = `/api/v1/products/${encodeURIComponent(product)}/groups/${encodeURIComponent(e)}/cleanup-strategy-choices`;
  return await fetchJson(url);
}

async function listIpInventory(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  return await fetchJson(`/api/v1/products/${encodeURIComponent(product)}/ip_inventory/${encodeURIComponent(e)}`);
}

async function listRules(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  return await fetchJson(`/api/v1/products/${encodeURIComponent(product)}/rules/${encodeURIComponent(e)}`);
}

async function saveIpInventory(env, payload) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const name = safeTrim(payload?.name);
  const originalName = safeTrim(payload?.original_name);
  if (!name) throw new Error("name is required");

  const body = {
    name,
    original_name: originalName || undefined,
    ...(payload?.data ? { data: payload.data } : {}),
  };

  const url = `/api/v1/products/${encodeURIComponent(product)}/ip_inventory/${encodeURIComponent(e)}`;
  return isNonEmptyString(originalName) ? await putJson(url, body) : await postJson(url, body);
}

async function deleteIpInventory(env, name) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const n = safeTrim(name);
  if (!n) throw new Error("name is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/ip_inventory/${encodeURIComponent(e)}?name=${encodeURIComponent(n)}`;
  return await deleteJson(url);
}

async function importIpInventoryFromFortimgr(env) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const url = `/api/v1/products/${encodeURIComponent(product)}/ip_inventory/${encodeURIComponent(e)}/importfortimgr`;
  return await postJson(url, {}, { timeoutMs: 120000 });
}

async function bulkUploadIpInventory(env, text) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const e = requireEnv(env);
  const url = `/api/v1/products/${encodeURIComponent(product)}/ip_inventory/${encodeURIComponent(e)}/bulk-upload`;
  return await postJson(url, { text: String(text || "") });
}

async function dedupePortProtocol(duplicateName, originalName) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const dup = safeTrim(duplicateName);
  const orig = safeTrim(originalName);
  if (!dup) throw new Error("duplicateName is required");
  if (!orig) throw new Error("originalName is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/port-protocol/dedupe`;
  return await postJson(url, { duplicate_name: dup, original_name: orig });
}

async function dedupeBusinessPurpose(duplicateName, originalName) {
  const product = getCurrentProduct();
  if (!isNonEmptyString(product)) throw new Error("Select a product first");
  const dup = safeTrim(duplicateName);
  const orig = safeTrim(originalName);
  if (!dup) throw new Error("duplicateName is required");
  if (!orig) throw new Error("originalName is required");
  const url = `/api/v1/products/${encodeURIComponent(product)}/business-purpose/dedupe`;
  return await postJson(url, { duplicate_name: dup, original_name: orig });
}
