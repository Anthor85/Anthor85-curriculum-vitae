import { Conocimiento } from '../../../../interfaces/conocimiento.interface';

import styles from './Items.module.scss';

interface Props {
  conocimiento: Conocimiento;
}

export const ConocimientoItem = ({ conocimiento }: Props) => {
  return (
    <li className={styles.Item}>
      <span className={styles.titulo}>{conocimiento.titulo}</span>
    </li>
  );
};
