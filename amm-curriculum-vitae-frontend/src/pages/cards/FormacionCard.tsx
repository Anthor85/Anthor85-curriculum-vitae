import { dateConverter } from '../../helpers/dateConverter';
import { Formacion } from '../../interfaces/formacion.interface';

import styles from './Cards.module.scss';

interface Props {
  formacion: Formacion;
  deleteFormacion: (id: string) => void;
  onEditar: (formacion: Formacion) => void;
  enEdicion: boolean;
}
export const FormacionCard = ({
  formacion,
  deleteFormacion,
  onEditar,
  enEdicion,
}: Props) => {
  const { titulo, institucion, fechaFin, id, descripcion } = formacion;

  return (
    <div
      className={`${styles.Card} ${enEdicion ? styles.enEdicion : ''}`}
      key={id}
    >
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion}
        </div>
        <div className={styles.subdata}>
          <b>Fecha:</b> {dateConverter(new Date(fechaFin))}
        </div>
        {descripcion && (
          <div className={styles.subdata}>
            <b>A tener en cuenta:</b> {descripcion}
          </div>
        )}
      </div>
      <div className={`${styles.actions} ${styles.actionsFila}`}>
        <button onClick={() => onEditar(formacion)}>Editar</button>
        <button onClick={() => deleteFormacion(id)}>Eliminar</button>
      </div>
    </div>
  );
};
