import EditableList from "../EditableList/EditableList";
import styles from "./KeywordList.module.css";

function KeywordList({ title, field, items, placeholder, onItemChange, onAdd, onRemove }) {
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
