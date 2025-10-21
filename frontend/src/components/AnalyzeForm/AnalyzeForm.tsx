import type { FormEvent, MouseEvent } from "react";
import Panel from "../Panel/Panel";
import styles from "./AnalyzeForm.module.css";

interface AnalyzeFormProps {
  id?: string;
  value: string;
  loading: boolean;
  error: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onShowHistory: (event: MouseEvent<HTMLButtonElement>) => void;
}

function AnalyzeForm({ id, value, loading, error, onChange, onSubmit, onShowHistory }: AnalyzeFormProps): JSX.Element {
  return (
    <Panel id={id} className={styles.panel}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>Profile Generator</span>
        <h2 className={styles.title}>
          Build a briefing <span>in minutes</span>
        </h2>
        <p className={styles.lead}>
          Drop in a company domain and let our analysts distill the key offerings, differentiators, and contacts instantly.
        </p>
      </div>

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
            {loading ? "Analyzing..." : "Generate insight"}
          </button>
        </div>
        <p className={styles.hint}>Use the profile as-is or refine each field before sharing with your team.</p>
      </form>

      {error && <p className={styles.error}>{error}</p>}
    </Panel>
  );
}

export default AnalyzeForm;
