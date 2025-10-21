import styles from "./Panel.module.css";

function Panel({ children, className = "" }) {
  const combinedClassName = [styles.panel, className].filter(Boolean).join(" ");
  return <section className={combinedClassName}>{children}</section>;
}

export default Panel;
