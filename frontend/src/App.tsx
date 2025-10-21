import { FormEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import AnalyzeForm from "./components/AnalyzeForm/AnalyzeForm";
import CompanyProfile from "./components/CompanyProfile/CompanyProfile";
import SavedProfiles from "./components/SavedProfiles/SavedProfiles";
import styles from "./App.module.css";
import { dedupeStrings, normalizeServiceLines, normalizeStringArray, splitServiceLine } from "./utils/profile";
import {
  AnalyzeApiResponse,
  ApiCompanyProfile,
  CompanyProfileState,
  ProfileEditableField,
  ProfileListField,
  StoredProfileSummary
} from "./types/profile";
import logoUrl from "./logo.svg";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

type TabKey = "analyze" | "history";

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>("analyze");
  const [urlInput, setUrlInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [profile, setProfile] = useState<CompanyProfileState | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [serviceSplitMessage, setServiceSplitMessage] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");
  const [history, setHistory] = useState<StoredProfileSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string>("");
  const [historyFetched, setHistoryFetched] = useState<boolean>(false);

  const loadHistory = useCallback(async () => {
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/profiles`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as Partial<{ error: string }>;
        const message = payload?.error || response.statusText || "Unable to load history.";
        throw new Error(message);
      }

      const data = (await response.json()) as { items?: StoredProfileSummary[] };
      setHistory(Array.isArray(data.items) ? data.items : []);
      setHistoryFetched(true);
    } catch (fetchError) {
      setHistoryError(getErrorMessage(fetchError) || "Unable to load saved profiles.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history" && !historyFetched) {
      void loadHistory();
    }
  }, [activeTab, historyFetched, loadHistory]);

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
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

      const data: AnalyzeApiResponse = await response.json();
      const mapped = mapApiResponseToState(data);
      setProfile(mapped);
      setUrlInput(data.url);
      setStatusMessage(data.cached ? "Loaded saved profile from history." : "New profile generated and saved.");
      setSaveError("");

      if (!data.cached || !historyFetched) {
        void loadHistory();
      }
    } catch (fetchError) {
      const message = getErrorMessage(fetchError) || "Something went wrong while analyzing the website.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProfile(null);
    setStatusMessage("");
    setServiceSplitMessage("");
    setSaveError("");
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

  const handleShowHistory = (event?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    event?.preventDefault();
    setActiveTab("history");
    if (!historyFetched) {
      void loadHistory();
    }
  };

  const handleShowHistoryFromForm = (event: MouseEvent<HTMLButtonElement>) => {
    handleShowHistory(event);
  };

  const handleSelectHistory = (item: StoredProfileSummary) => {
    const mapped = mapSummaryToState(item);
    setProfile(mapped);
    setUrlInput(item.url);
    setStatusMessage("Loaded saved profile from history.");
    setServiceSplitMessage("");
    setSaveError("");
    setActiveTab("analyze");
  };

  const handleSave = async () => {
    if (!profile || !profile.id) {
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const payload = toApiProfilePayload(profile);
      const response = await fetch(`${API_BASE_URL}/api/profiles/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: profile.source_url, profile: payload })
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Partial<{ error: string }>;
        const message = data?.error || response.statusText || "Unable to save profile.";
        throw new Error(message);
      }

      const data: AnalyzeApiResponse = await response.json();
      const mapped = mapApiResponseToState(data);
      setProfile(mapped);
      setStatusMessage("Profile saved.");
      setServiceSplitMessage("");
      void loadHistory();
    } catch (saveErr) {
      const message = getErrorMessage(saveErr) || "Unable to save profile.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const isAnalyzeTab = activeTab === "analyze";

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img className={styles.brandLogo} src={"/logo.svg"} alt="McCarren logo" />
        </div>
        <a className={styles.demoButton} href="mailto:hello@mccarren.ai">
          Request a demo
        </a>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Gather companies info
          <span className={styles.heroLine}>on the internet</span>
          <span className={styles.heroMuted}>with AI agents</span>
        </h1>
        <p className={styles.heroDescription}>
          Gather public information, categorize companies, and reach out—powered by AI.
        </p>
      </section>

      <div className={styles.tabBar} role="tablist" aria-label="Profile views">
        <button
          type="button"
          className={`${styles.tabButton} ${isAnalyzeTab ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("analyze")}
          role="tab"
          aria-selected={isAnalyzeTab}
        >
          Analyzer
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${!isAnalyzeTab ? styles.tabButtonActive : ""}`}
          onClick={() => {
            setActiveTab("history");
            if (!historyFetched) {
              void loadHistory();
            }
          }}
          role="tab"
          aria-selected={!isAnalyzeTab}
        >
          Saved profiles
        </button>
      </div>

      <main className={styles.content}>
        {isAnalyzeTab ? (
          <>
            <AnalyzeForm
              id="intel-form"
              value={urlInput}
              loading={loading}
              error={error}
              onChange={setUrlInput}
              onSubmit={handleAnalyze}
              onShowHistory={handleShowHistoryFromForm}
            />
            {profile && (
              <CompanyProfile
                profile={profile}
                serviceSplitMessage={serviceSplitMessage}
                statusMessage={statusMessage}
                saving={saving}
                saveError={saveError}
                onReset={handleReset}
                onFieldChange={handleFieldChange}
                onListChange={handleListChange}
                onAddListItem={handleAddListItem}
                onRemoveListItem={handleRemoveListItem}
                onSmartSplit={handleSmartSplit}
                onSave={handleSave}
              />
            )}
          </>
        ) : (
          <SavedProfiles
            id="saved"
            items={history}
            loading={historyLoading}
            error={historyError}
            onSelect={handleSelectHistory}
            onRefresh={loadHistory}
          />
        )}
      </main>
    </div>
  );
}

function mapApiResponseToState(data: AnalyzeApiResponse): CompanyProfileState {
  return {
    id: data.id,
    company_name: data.profile.company_name ?? "",
    company_description: data.profile.company_description ?? "",
    poc: data.profile.poc ?? "",
    service_lines: normalizeServiceLines(data.profile.service_lines),
    tier1_keywords: normalizeStringArray(data.profile.tier1_keywords),
    tier2_keywords: normalizeStringArray(data.profile.tier2_keywords),
    emails: normalizeStringArray(data.profile.emails),
    source_url: data.url,
    cached: data.cached,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

function mapSummaryToState(summary: StoredProfileSummary): CompanyProfileState {
  return {
    id: summary.id,
    company_name: summary.profile.company_name ?? "",
    company_description: summary.profile.company_description ?? "",
    poc: summary.profile.poc ?? "",
    service_lines: normalizeServiceLines(summary.profile.service_lines),
    tier1_keywords: normalizeStringArray(summary.profile.tier1_keywords),
    tier2_keywords: normalizeStringArray(summary.profile.tier2_keywords),
    emails: normalizeStringArray(summary.profile.emails),
    source_url: summary.url,
    cached: true,
    created_at: summary.created_at,
    updated_at: summary.updated_at
  };
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

function toApiProfilePayload(state: CompanyProfileState): ApiCompanyProfile {
  return {
    company_name: sanitizeString(state.company_name),
    company_description: sanitizeString(state.company_description),
    poc: sanitizeString(state.poc),
    service_lines: sanitizeArray(state.service_lines),
    tier1_keywords: sanitizeArray(state.tier1_keywords),
    tier2_keywords: sanitizeArray(state.tier2_keywords),
    emails: sanitizeArray(state.emails)
  };
}

function sanitizeString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeArray(values: string[]): string[] {
  return dedupeStrings(values)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
}

export default App;
