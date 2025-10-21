import type { PropsWithChildren } from "react";
import styles from "./Panel.module.css";

interface PanelProps {
  className?: string;
  id?: string;
}

function Panel({ children, className = "", id }: PropsWithChildren<PanelProps>): JSX.Element {
  const combinedClassName = className ? `${styles.panel} ${className}` : styles.panel;
  return (
    <section id={id} className={combinedClassName}>
      {children}
    </section>
  );
}

export default Panel;
