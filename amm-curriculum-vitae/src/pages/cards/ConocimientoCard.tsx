import { Conocimiento } from "../../interfaces/conocimiento.interface";

import styles from "./Cards.module.scss";

interface Props {
  conocimiento: Conocimiento;
  deleteConocimiento: (id: string) => void;
}

export const ConocimientoCard = ({
  conocimiento,
  deleteConocimiento,
}: Props) => {
  const { titulo, nivel, id } = conocimiento;

  return (
    <div className={styles.Card} key={id}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        {nivel && (
          <div className={styles.subdata}>
            <b>Nivel:</b> {nivel}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <button onClick={() => deleteConocimiento(id)}>Delete</button>
      </div>
    </div>
  );
};
