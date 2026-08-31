import { Formacion } from '../../interfaces/formacion.interface';

import styles from './Cards.module.scss';

interface Props {
  formacion: Formacion;
  deleteFormacion: (id: string) => void;
}
export const FormacionCard = ({ formacion, deleteFormacion }: Props) => {
  const { titulo, institucion, fechaFin, id, descripcion } = formacion;

  return (
    <div className={styles.Card} key={id}>
      <div className={styles.data}>
        <div className={styles.title}>{titulo}</div>
        <div className={styles.subdata}>
          <b>Institución:</b> {institucion}
        </div>
        <div className={styles.subdata}>
          <b>Fecha:</b> {new Date(fechaFin).toLocaleDateString()}
        </div>
        {descripcion && (
          <div className={styles.subdata}>
            <b>Descripción:</b> {descripcion}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <button onClick={() => deleteFormacion(id)}>Eliminar</button>
      </div>
    </div>
  );
};
