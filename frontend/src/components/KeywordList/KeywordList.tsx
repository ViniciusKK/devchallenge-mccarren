import type { ProfileListField } from "../../types/profile";
import EditableList from "../EditableList/EditableList";
import styles from "./KeywordList.module.css";

type KeywordField = Extract<ProfileListField, "tier1_keywords" | "tier2_keywords">;

interface KeywordListProps {
  title: string;
  field: KeywordField;
  items: string[];
  placeholder: string;
  onItemChange: (field: ProfileListField, index: number, value: string) => void;
  onAdd: (field: ProfileListField) => void;
  onRemove: (field: ProfileListField, index: number) => void;
}

function KeywordList({ title, field, items, placeholder, onItemChange, onAdd, onRemove }: KeywordListProps): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <h3>{title}</h3>
          <p className={styles.hint}>Use concise tags to capture relevant topics.</p>
        </div>
        <button type="button" onClick={() => onAdd(field)}>
          Add keyword
        </button>
      </div>
      <EditableList field={field} items={items} placeholder={placeholder} onItemChange={onItemChange} onRemove={onRemove} />
    </div>
  );
}

export default KeywordList;
