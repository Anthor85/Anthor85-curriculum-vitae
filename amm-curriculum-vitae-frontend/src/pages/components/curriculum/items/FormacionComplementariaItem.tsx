import { anioFecha } from '../../../../helpers/anioFecha';
import { FormacionComplementaria } from '../../../../interfaces/formacionComplementaria.interface';

import styles from './Items.module.scss';

interface Props {
  formacionComplementaria: FormacionComplementaria;
}

export const FormacionComplementariaItem = ({
  formacionComplementaria,
}: Props) => {
  return (
    <div className={styles.Item}>
      <h3 className={styles.titulo}>{formacionComplementaria.titulo}</h3>
      <span className={styles.subtitulo}>
        {formacionComplementaria.institucion}
      </span>
      {formacionComplementaria.fechaFin && (
        <span className={styles.fechas}>
          {anioFecha(formacionComplementaria.fechaFin)}
        </span>
      )}
    </div>
  );
};
