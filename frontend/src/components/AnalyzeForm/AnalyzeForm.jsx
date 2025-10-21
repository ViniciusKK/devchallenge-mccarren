import Panel from "../Panel/Panel";
import styles from "./AnalyzeForm.module.css";

function AnalyzeForm({ value, loading, error, onChange, onSubmit }) {
  return (
    <Panel>
      <h1 className={styles.title}>Company Intelligence Builder</h1>
      <p className={styles.lead}>Enter a company website to generate a profile, then refine the details before saving or sharing.</p>

      <form className={styles.form} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor="companyUrl">
          Company website
        </label>
        <div className={styles.inputRow}>
          <input
            id="companyUrl"
            type="url"
            placeholder="https://www.coca-cola.com"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Generate profile"}
          </button>
        </div>
        <p className={styles.hint}>We will use GPT to suggest company info. You can tweak everything afterwards.</p>
      </form>

      {error && <p className={styles.error}>{error}</p>}
    </Panel>
  );
}

export default AnalyzeForm;
