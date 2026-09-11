import { Conocimiento } from '../../../../interfaces/conocimiento.interface';

import styles from './Items.module.scss';

interface Props {
  conocimiento: Conocimiento;
}

export const ConocimientoItem = ({ conocimiento }: Props) => {
  return (
    <div className={styles.Item}>
      <h2 className={styles.titulo}>{conocimiento.titulo}</h2>
    </div>
  );
};
