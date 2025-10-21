import type { CompanyProfileState, ProfileEditableField, ProfileListField } from "../../types/profile";
import EditableList from "../EditableList/EditableList";
import KeywordList from "../KeywordList/KeywordList";
import Panel from "../Panel/Panel";
import styles from "./CompanyProfile.module.css";

interface CompanyProfileProps {
  profile: CompanyProfileState;
  serviceSplitMessage: string;
  statusMessage?: string;
  saving: boolean;
  saveError: string;
  onReset: () => void;
  onFieldChange: (field: ProfileEditableField, value: string) => void;
  onListChange: (field: ProfileListField, index: number, value: string) => void;
  onAddListItem: (field: ProfileListField) => void;
  onRemoveListItem: (field: ProfileListField, index: number) => void;
  onSmartSplit: () => void;
  onSave: () => void | Promise<void>;
}

function CompanyProfile({
  profile,
  serviceSplitMessage,
  statusMessage,
  saving,
  saveError,
  onReset,
  onFieldChange,
  onListChange,
  onAddListItem,
  onRemoveListItem,
  onSmartSplit,
  onSave
}: CompanyProfileProps): JSX.Element {
  const sourceUrl = profile.source_url ?? "";
  const canSave = Boolean(profile.id);
  const createdLabel = profile.created_at ? new Date(profile.created_at).toLocaleString() : null;
  const updatedLabel =
    profile.updated_at && profile.updated_at !== profile.created_at ? new Date(profile.updated_at).toLocaleString() : null;
  const visitDisabled = !sourceUrl;

  return (
    <Panel className={styles.card}>
      {saveError && <div className={styles.errorBanner}>{saveError}</div>}
      {statusMessage && <div className={styles.statusBanner}>{statusMessage}</div>}

      <header className={styles.header}>
        <div>
          <h2>Company Profile</h2>
          <p className={styles.sourceUrl}>{profile.source_url}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryButton} onClick={onSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <a
            className={`${styles.outlineButton} ${visitDisabled ? styles.outlineButtonDisabled : ""}`}
            href={visitDisabled ? "#" : sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (visitDisabled) {
                event.preventDefault();
              }
            }}
            aria-disabled={visitDisabled}
          >
            Visit site
          </a>
          <button type="button" className={styles.ghostButton} onClick={onReset}>
            Start over
          </button>
        </div>
      </header>

      <div className={styles.meta}>
        <span className={`${styles.badge} ${profile.cached ? styles.badgeSaved : styles.badgeFresh}`}>
          {profile.cached ? "Saved profile" : "New profile"}
        </span>
        {createdLabel && <span className={styles.metaLine}>Created {createdLabel}</span>}
        {updatedLabel && <span className={styles.metaLine}>Updated {updatedLabel}</span>}
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="companyName">
            Company name
          </label>
          <input
            id="companyName"
            type="text"
            value={profile.company_name}
            onChange={(event) => onFieldChange("company_name", event.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="poc">
            Point of contact
          </label>
          <input
            id="poc"
            type="text"
            value={profile.poc}
            onChange={(event) => onFieldChange("poc", event.target.value)}
            placeholder="Name or role"
          />
        </div>

        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label className={styles.label} htmlFor="companyDescription">
            Company description
          </label>
          <textarea
            id="companyDescription"
            rows={4}
            value={profile.company_description}
            onChange={(event) => onFieldChange("company_description", event.target.value)}
            placeholder="Brief overview of the company"
          />
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Service lines</h3>
            <p className={styles.hint}>Represent each distinct offering. Use the smart split to break up long sentences.</p>
            {serviceSplitMessage && <p className={`${styles.hint} ${styles.muted}`}>{serviceSplitMessage}</p>}
          </div>
          <div className={styles.sectionActions}>
            <button type="button" className={styles.ghostButton} onClick={onSmartSplit}>
              Smart split
            </button>
            <button type="button" onClick={() => onAddListItem("service_lines")}>
              Add service line
            </button>
          </div>
        </div>
        <EditableList
          field="service_lines"
          items={profile.service_lines}
          placeholder="e.g., Cybersecurity consulting"
          onItemChange={onListChange}
          onRemove={onRemoveListItem}
        />
      </div>

      <hr className={styles.divider} />

      <div className={styles.keywordGroups}>
        <KeywordList
          title="Tier 1 keywords"
          field="tier1_keywords"
          items={profile.tier1_keywords}
          placeholder="Add a primary keyword"
          onItemChange={onListChange}
          onAdd={onAddListItem}
          onRemove={onRemoveListItem}
        />
        <KeywordList
          title="Tier 2 keywords"
          field="tier2_keywords"
          items={profile.tier2_keywords}
          placeholder="Add a supporting keyword"
          onItemChange={onListChange}
          onAdd={onAddListItem}
          onRemove={onRemoveListItem}
        />
      </div>

      <hr className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>Emails</h3>
            <p className={styles.hint}>Add direct contacts for outreach. GPT can leave this blank.</p>
          </div>
          <button type="button" onClick={() => onAddListItem("emails")}>
            Add email
          </button>
        </div>
        <EditableList
          field="emails"
          items={profile.emails}
          placeholder="name@company.com"
          onItemChange={onListChange}
          onRemove={onRemoveListItem}
          validator={(value) => !value || /\S+@\S+\.\S+/.test(value)}
        />
      </div>
    </Panel>
  );
}

export default CompanyProfile;
