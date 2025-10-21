import { FormEvent, useState } from "react";
import AnalyzeForm from "./components/AnalyzeForm/AnalyzeForm";
import CompanyProfile from "./components/CompanyProfile/CompanyProfile";
import styles from "./App.module.css";
import { dedupeStrings, normalizeServiceLines, normalizeStringArray, splitServiceLine } from "./utils/profile";
import { AnalyzeResponsePayload, CompanyProfileState, ProfileEditableField, ProfileListField } from "./types/profile";
import logoUrl from "./logo.svg";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

function App(): JSX.Element {
  const [urlInput, setUrlInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [profile, setProfile] = useState<CompanyProfileState | null>(null);
  const [serviceSplitMessage, setServiceSplitMessage] = useState<string>("");

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
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
        const payload = (await response.json().catch(() => ({}))) as Partial<{ error: string }>;
        const message = payload?.error || response.statusText || "Request failed";
        throw new Error(message);
      }

      const data: AnalyzeResponsePayload = await response.json();
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
      const message = getErrorMessage(fetchError) || "Something went wrong while analyzing the website.";
      setError(message);
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

  const handleFieldChange = (field: ProfileEditableField, value: string) => {
    setProfile((previous) => (previous ? { ...previous, [field]: value } : previous));
  };

  const handleListChange = (field: ProfileListField, index: number, value: string) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const next = [...(previous[field] as string[])];
      next[index] = value;
      return { ...previous, [field]: next };
    });
  };

  const handleAddListItem = (field: ProfileListField) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const current = previous[field] as string[];
      return { ...previous, [field]: [...current, ""] };
    });
  };

  const handleRemoveListItem = (field: ProfileListField, index: number) => {
    setProfile((previous) => {
      if (!previous) return previous;
      const current = previous[field] as string[];
      const next = current.filter((_, itemIndex) => itemIndex !== index);

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
      <header className={styles.header}>
        <div className={styles.brand}>
          <img className={styles.brandLogo} src={"/logo.svg"} alt="McCarren logo" />
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}></p>
        <h1 className={styles.heroTitle}>
          Generating company
          <span className={styles.heroLine}>profiles</span>
          <span className={styles.heroMuted}>with AI agents</span>
        </h1>
        <p className={styles.heroDescription}>
          Our AI agents surface opportunities, draft proposals, and keep your pipeline humming around the clock. You focus on
          growth, we handle the intel.
        </p>
        <a className={styles.heroCta} href="#intel-form">
          Build a profile
        </a>
      </section>

      <main className={styles.content}>
        <AnalyzeForm
          id="intel-form"
          value={urlInput}
          loading={loading}
          error={error}
          onChange={setUrlInput}
          onSubmit={handleAnalyze}
        />
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "";
  }
}

export default App;
