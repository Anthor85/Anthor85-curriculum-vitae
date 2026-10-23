import { anioFecha } from '../../../../helpers/anioFecha';
import { Formacion } from '../../../../interfaces/formacion.interface';

import styles from './Items.module.scss';

interface Props {
  formacion: Formacion;
}

export const FormacionItem = ({ formacion }: Props) => {
  return (
    <div className={styles.Item}>
      <h3 className={styles.titulo}>{formacion.titulo}</h3>
      <span className={styles.subtitulo}>{formacion.institucion}</span>
      <span className={styles.fechas}>{anioFecha(formacion.fechaFin)}</span>
      {formacion.extras?.length ? (
        <ul className={styles.extras}>
          {formacion.extras.map((extra) => (
            <li key={extra.id}>{extra.descripcion}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
