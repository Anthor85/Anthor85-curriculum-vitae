import { useState, type ReactNode } from 'react';
import styles from './Expandable.module.scss';

interface ExpandableProps {
  cabecera: ReactNode;
  inicialAbierto?: boolean;
  children: ReactNode;
}

export const Expandable = ({
  cabecera,
  inicialAbierto = false,
  children,
}: ExpandableProps) => {
  const [abierto, setAbierto] = useState(inicialAbierto);

  return (
    <div className={styles.Expandable}>
      <button
        type="button"
        aria-expanded={abierto}
        className={styles.cabecera}
        onClick={() => setAbierto(!abierto)}
      >
        {cabecera}
        <span
          className={`${styles.triangulo} ${abierto ? styles.abierto : ''}`}
        ></span>
      </button>
      {abierto && children}
    </div>
  );
};
