function App() {
  const [activeTab, setActiveTab] = React.useState("fw-rules");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const content = React.useMemo(() => {
    if (activeTab === "port-protocol") {
      return <PortProtocolTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "business-purpose") {
      return <BusinessPurposeTable setLoading={setLoading} setError={setError} />;
    }
    if (activeTab === "env") {
      return <EnvTable setLoading={setLoading} setError={setError} />;
    }
    return <FwRulesTable setLoading={setLoading} setError={setError} />;
  }, [activeTab]);

  return (
    <AppView
      activeTab={activeTab}
      onSetTab={(t) => {
        setError("");
        setActiveTab(t);
      }}
      error={error}
      loading={loading}
    >
      {content}
    </AppView>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
