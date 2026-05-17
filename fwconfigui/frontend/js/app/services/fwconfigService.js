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

function isProductScopedType(type) {
  const t = safeTrim(type);
  return (
    t === "keywords" ||
    t === "rule-files" ||
    t === "components" ||
    t === "port-protocol" ||
    t === "business-purpose" ||
    t === "fw-rules"
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
