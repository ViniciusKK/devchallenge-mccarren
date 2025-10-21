import { useState } from "react";
import AnalyzeForm from "./components/AnalyzeForm/AnalyzeForm";
import CompanyProfile from "./components/CompanyProfile/CompanyProfile";
import styles from "./App.module.css";
import { dedupeStrings, normalizeServiceLines, normalizeStringArray, splitServiceLine } from "./utils/profile";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

function App() {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [serviceSplitMessage, setServiceSplitMessage] = useState("");

  const handleAnalyze = async (event) => {
    event.preventDefault();
    setError("");
    setServiceSplitMessage("");

    const candidateUrl = urlInput.trim();
    if (!candidateUrl) {
      setError("Please enter a company website URL.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: candidateUrl })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload?.error || response.statusText || "Request failed";
        throw new Error(message);
      }

      const data = await response.json();
      setProfile({
        company_name: data.company_name ?? "",
        company_description: data.company_description ?? "",
        poc: data.poc ?? "",
        service_lines: normalizeServiceLines(data.service_line),
        tier1_keywords: normalizeStringArray(data.tier1_keywords),
        tier2_keywords: normalizeStringArray(data.tier2_keywords),
        emails: normalizeStringArray(data.emails),
        source_url: candidateUrl
      });
    } catch (fetchError) {
      setError(fetchError.message || "Something went wrong while analyzing the website.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProfile(null);
    setUrlInput("");
    setError("");
    setServiceSplitMessage("");
  };

  const handleFieldChange = (field, value) => {
    setProfile((previous) => (previous ? { ...previous, [field]: value } : previous));
  };

  const handleListChange = (field, index, value) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const next = [...previous[field]];
      next[index] = value;
      return { ...previous, [field]: next };
    });
  };

  const handleAddListItem = (field) => {
    setProfile((previous) => {
      if (!previous) return previous;
      return { ...previous, [field]: [...previous[field], ""] };
    });
  };

  const handleRemoveListItem = (field, index) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const next = previous[field].filter((_, itemIndex) => itemIndex !== index);
      if (field === "service_lines" && next.length === 0) {
        next.push("");
      }
      return { ...previous, [field]: next };
    });
  };

  const handleSmartSplit = () => {
    if (!profile) return;

    const expanded = profile.service_lines.flatMap(splitServiceLine);
    const uniqueExpanded = dedupeStrings(expanded);

    if (uniqueExpanded.length <= profile.service_lines.filter((line) => line.trim()).length) {
      setServiceSplitMessage("No additional service lines detected. You can edit or add lines manually.");
      return;
    }

    setProfile((previous) => (previous ? { ...previous, service_lines: uniqueExpanded } : previous));
    setServiceSplitMessage(`Split into ${uniqueExpanded.length} service lines. Adjust as needed.`);
  };

  return (
    <div className={styles.appShell}>
      <main className={styles.content}>
        <AnalyzeForm value={urlInput} loading={loading} error={error} onChange={setUrlInput} onSubmit={handleAnalyze} />
        {profile && (
          <CompanyProfile
            profile={profile}
            serviceSplitMessage={serviceSplitMessage}
            onReset={handleReset}
            onFieldChange={handleFieldChange}
            onListChange={handleListChange}
            onAddListItem={handleAddListItem}
            onRemoveListItem={handleRemoveListItem}
            onSmartSplit={handleSmartSplit}
          />
        )}
      </main>
    </div>
  );
}

export default App;
