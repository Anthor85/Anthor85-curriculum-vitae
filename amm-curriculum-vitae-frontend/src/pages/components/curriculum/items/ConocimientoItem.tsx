import { IconoSvg } from '../../../../components/IconoSvg';
import { Conocimiento } from '../../../../interfaces/conocimiento.interface';

import styles from './Items.module.scss';

interface Props {
  conocimiento: Conocimiento<string>;
}

export const ConocimientoItem = ({ conocimiento }: Props) => {
  const { icono, titulo } = conocimiento;

  if (!icono) {
    return (
      <li className={styles.Item}>
        <span className={styles.titulo}>{titulo}</span>
      </li>
    );
  }

  return (
    <li className={`${styles.Item} ${styles.conIcono}`}>
      <IconoSvg svg={icono} />
      <span className={styles.titulo}>{titulo}</span>
    </li>
  );
};
