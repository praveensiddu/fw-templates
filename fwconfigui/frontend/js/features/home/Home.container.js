/**
 * Home - container for the Home tab (tool settings).
 *
 * Manages the settings form state, loads/saves settings via the home API,
 * and fills the form with pre-prepared samples on request.
 */
function Home({ setLoading, setError, onSaved }) {
  const [form, setForm] = React.useState({
    WORKSPACE: "~/workspace",
    TEMPLATES_GITREPO_GROUP: "",
    RENDERED_GITREPO_GROUP: "",
    RENDERED_FOLDER_PREFIX: "iac/fw",
    INFRA_REPO: "",
    FWCONFIGFILES: "fwconfigfiles",
  });
  const [busy, setBusy] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState("");

  const applySettings = React.useCallback((s) => {
    const src = s && typeof s === "object" ? s : {};
    setForm({
      WORKSPACE: safeTrim(src.WORKSPACE) || "~/workspace",
      TEMPLATES_GITREPO_GROUP: safeTrim(src.TEMPLATES_GITREPO_GROUP),
      RENDERED_GITREPO_GROUP: safeTrim(src.RENDERED_GITREPO_GROUP),
      RENDERED_FOLDER_PREFIX: safeTrim(src.RENDERED_FOLDER_PREFIX) || "iac/fw",
      INFRA_REPO: safeTrim(src.INFRA_REPO),
      FWCONFIGFILES: safeTrim(src.FWCONFIGFILES) || "fwconfigfiles",
    });
  }, []);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const resp = await loadHomeSettings();
      applySettings(resp?.settings);
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, applySettings]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onChange = React.useCallback((key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setSavedMsg("");
  }, []);

  const onUseSamples = React.useCallback(async () => {
    try {
      setBusy(true);
      setError("");
      const resp = await applyHomeSamples();
      applySettings(resp?.settings);
      const failed = (Array.isArray(resp?.clones) ? resp.clones : []).filter(
        (c) => c && c.status === "error"
      );
      if (failed.length) {
        setError("Sample repository clone failed for: " + failed.map((c) => c.repo).join(", "));
      } else {
        setSavedMsg("Sample repositories ready under cloned-repositories.");
      }
    } catch (e) {
      setError(formatError(e));
    } finally {
      setBusy(false);
    }
  }, [setError, applySettings]);

  const onSave = React.useCallback(async () => {
    try {
      setBusy(true);
      setLoading(true);
      setError("");
      const resp = await saveHomeSettings(form);
      applySettings(resp?.settings);
      setSavedMsg("Saved.");
      if (typeof onSaved === "function") onSaved();
    } catch (e) {
      setError(formatError(e));
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }, [form, setLoading, setError, applySettings, onSaved]);

  const canSave = React.useMemo(
    () =>
      isNonEmptyString(form.WORKSPACE) &&
      isNonEmptyString(form.TEMPLATES_GITREPO_GROUP) &&
      isNonEmptyString(form.RENDERED_GITREPO_GROUP) &&
      isNonEmptyString(form.RENDERED_FOLDER_PREFIX) &&
      isNonEmptyString(form.INFRA_REPO),
    [form]
  );

  return (
    <HomeView
      form={form}
      busy={busy}
      savedMsg={savedMsg}
      canSave={canSave}
      onChange={onChange}
      onUseSamples={onUseSamples}
      onSave={onSave}
    />
  );
}
