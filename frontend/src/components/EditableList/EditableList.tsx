import type { ProfileListField } from "../../types/profile";
import styles from "./EditableList.module.css";

interface EditableListProps {
  field: ProfileListField;
  items: string[];
  placeholder: string;
  onItemChange: (field: ProfileListField, index: number, value: string) => void;
  onRemove: (field: ProfileListField, index: number) => void;
  validator?: (value: string) => boolean;
}

function EditableList({ field, items, placeholder, onItemChange, onRemove, validator }: EditableListProps): JSX.Element {
  return (
    <ul className={styles.list}>
      {items.map((value, index) => {
        const trimmedValue = value.trim();
        const isValid = validator ? validator(trimmedValue) : true;
        const itemClassName = [styles.item, !isValid ? styles.invalid : ""].filter(Boolean).join(" ");

        return (
          <li key={`${field}-${index}`} className={itemClassName}>
            <input
              className={styles.input}
              type="text"
              value={value}
              placeholder={placeholder}
              onChange={(event) => onItemChange(field, index, event.target.value)}
            />
            <button type="button" className={styles.removeButton} onClick={() => onRemove(field, index)} aria-label={`Remove ${field} item ${index + 1}`}>
              Remove
            </button>
          </li>
        );
      })}
      {items.length === 0 && (
        <li className={`${styles.item} ${styles.emptyItem}`}>
          <em>No entries yet. Use the add button to create one.</em>
        </li>
      )}
    </ul>
  );
}

export default EditableList;
