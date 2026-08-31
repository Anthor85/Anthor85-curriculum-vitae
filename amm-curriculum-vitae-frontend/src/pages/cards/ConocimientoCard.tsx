import { Conocimiento } from '../../interfaces/conocimiento.interface';

import styles from './Cards.module.scss';

interface Props {
  conocimiento: Conocimiento;
  deleteConocimiento: (id: string) => void;
  onEditar: (conocimiento: Conocimiento) => void;
  enEdicion: boolean;
}

export const ConocimientoCard = ({
  conocimiento,
  deleteConocimiento,
  onEditar,
  enEdicion,
}: Props) => {
  const { titulo, nivel, id } = conocimiento;

  return (
    <div
      className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}
      key={id}
    >
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        {nivel && (
          <div className={styles.subdata}>
            <b>Nivel:</b> {nivel}
          </div>
        )}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <button onClick={() => onEditar(conocimiento)}>Editar</button>
        <button onClick={() => deleteConocimiento(id)}>Delete</button>
      </div>
    </div>
  );
};
