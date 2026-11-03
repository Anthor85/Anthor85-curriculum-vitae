import { useTranslation } from 'react-i18next';

import { getIcons } from '../helpers/getIcons';

import styles from './Spinner.module.scss';

export const Spinner = () => {
  const { t } = useTranslation();
  return (
    <img
      className={styles.spinner}
      src={getIcons('spinner-arc')}
      alt={t('spinner.cargando')}
    />
  );
};
