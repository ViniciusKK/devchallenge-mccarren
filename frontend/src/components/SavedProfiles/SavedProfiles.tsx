import type { StoredProfileSummary } from "../../types/profile";
import Panel from "../Panel/Panel";
import styles from "./SavedProfiles.module.css";

interface SavedProfilesProps {
  id?: string;
  items: StoredProfileSummary[];
  loading: boolean;
  error: string;
  onSelect: (item: StoredProfileSummary) => void;
  onRefresh: () => void | Promise<void>;
}

function SavedProfiles({ id, items, loading, error, onSelect, onRefresh }: SavedProfilesProps): JSX.Element {
  return (
    <Panel id={id} className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2>Saved profiles</h2>
          <p className={styles.subhead}>Reopen a previously generated briefing or refresh the list for the latest additions.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.refreshButton} onClick={() => onRefresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh list"}
          </button>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading && items.length === 0 ? (
        <p className={styles.empty}>Loading saved profiles…</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No saved profiles yet. Run an analysis to populate this list.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <div className={styles.summary}>
                <h3>{getDisplayName(item)}</h3>
                <p className={styles.description}>
                  {item.profile.company_description ?? "No description captured for this company yet."}
                </p>
                <div className={styles.meta}>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  <span className={styles.url}>{item.url}</span>
                </div>
              </div>
              <div className={styles.buttons}>
                <button type="button" onClick={() => onSelect(item)}>
                  Load profile
                </button>
                <a className={styles.outlineButton} href={item.url} rel="noopener noreferrer" target="_blank">
                  Visit site
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default SavedProfiles;

function getDisplayName(item: StoredProfileSummary): string {
  if (item.profile.company_name && item.profile.company_name.trim().length > 0) {
    return item.profile.company_name;
  }
  return safeHostname(item.url);
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
