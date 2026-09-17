import { getIcons } from '../helpers/getIcons';

import styles from './Spinner.module.scss';

export const Spinner = () => {
  return (
    <img
      className={styles.spinner}
      src={getIcons('spinner-arc')}
      alt="Cargando..."
    />
  );
};
