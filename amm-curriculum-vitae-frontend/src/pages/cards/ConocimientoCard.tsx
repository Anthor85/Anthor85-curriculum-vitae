import { Button } from '../../components/Button';
import {
  Conocimiento,
  ETIQUETAS_PRIORIDAD,
} from '../../interfaces/conocimiento.interface';

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
  const { titulo, prioridad, id } = conocimiento;

  return (
    <div className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo.es}</div>
        {prioridad && (
          <div className={styles.subdata}>
            <b>Prioridad:</b> {ETIQUETAS_PRIORIDAD[prioridad] ?? prioridad}
          </div>
        )}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <Button onClick={() => onEditar(conocimiento)} name="Editar" />
        <Button onClick={() => deleteConocimiento(id)} name="Eliminar" />
      </div>
    </div>
  );
};
