import { dateConverter } from '../../helpers/dateConverter';
import { FormacionComplementaria } from '../../interfaces/formacionComplementaria.interface';

import styles from './Curriculum.module.scss';

interface Props {
  formacionComplementaria: FormacionComplementaria;
}

export const FormacionComplementariaItem = ({
  formacionComplementaria,
}: Props) => {
  return (
    <div className={styles.Item}>
      <h2 className={styles.titulo}>{formacionComplementaria.titulo}</h2>
      <span className={styles.subtitulo}>
        {formacionComplementaria.institucion}
      </span>
      {formacionComplementaria.fechaFin && (
        <span className={styles.fechas}>
          {dateConverter(new Date(formacionComplementaria.fechaFin))}
        </span>
      )}
    </div>
  );
};
