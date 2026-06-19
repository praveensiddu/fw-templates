/**
 * Auth / current-user API helpers.
 */

async function fetchCurrentUser() {
  return await fetchJson("/api/v1/current-user");
}

async function fetchDemoUsers() {
  return await fetchJson("/api/v1/demo-users");
}

async function setCurrentUser(user) {
  const name = safeTrim(user);
  if (!name) throw new Error("user is required");
  return await putJson("/api/v1/current-user", { user: name });
}
