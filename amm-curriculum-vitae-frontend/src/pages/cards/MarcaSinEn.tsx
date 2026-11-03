import styles from './Cards.module.scss';

// Avisa de que la entidad tiene algún texto sin versión en inglés
export const MarcaSinEn = () => (
  <span className={styles.sinEn} title="Falta la traducción al inglés">
    Sin EN
  </span>
);
