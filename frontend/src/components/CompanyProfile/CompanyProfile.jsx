import EditableList from "../EditableList/EditableList";
import KeywordList from "../KeywordList/KeywordList";
import Panel from "../Panel/Panel";
import styles from "./CompanyProfile.module.css";

function CompanyProfile({
  profile,
  serviceSplitMessage,
  onReset,
  onFieldChange,
  onListChange,
  onAddListItem,
  onRemoveListItem,
  onSmartSplit
}) {
  if (!profile) return null;

  return (
    <Panel className={styles.card}>
      <header className={styles.header}>
        <div>
          <h2>Company Profile</h2>
          <p className={styles.sourceUrl}>{profile.source_url}</p>
        </div>
        <button type="button" className={styles.ghostButton} onClick={onReset}>
          Start over
        </button>
      </header>

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

        <div className={[styles.field, styles.fullWidth].join(" ")}>
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
            {serviceSplitMessage && <p className={[styles.hint, styles.muted].join(" ")}>{serviceSplitMessage}</p>}
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
