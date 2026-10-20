import { anioFecha } from '../../../../helpers/anioFecha';
import { Formacion } from '../../../../interfaces/formacion.interface';

import styles from './Items.module.scss';

interface Props {
  formacion: Formacion;
}

export const FormacionItem = ({ formacion }: Props) => {
  return (
    <div className={styles.Item}>
      <h2 className={styles.titulo}>{formacion.titulo}</h2>
      <span className={styles.subtitulo}>{formacion.institucion}</span>
      <span className={styles.fechas}>{anioFecha(formacion.fechaFin)}</span>
      {formacion.descripcion && (
        <p className={styles.descripcion}>{formacion.descripcion}</p>
      )}
    </div>
  );
};
