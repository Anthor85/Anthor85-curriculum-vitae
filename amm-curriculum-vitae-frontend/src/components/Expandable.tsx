import { useState, type ReactNode } from 'react';
import styles from './Expandable.module.scss';

interface ExpandableProps {
  cabecera: ReactNode;
  inicialAbierto?: boolean;
  // Pinta cabecera y children tal cual, sin plegado (p. ej. para el PDF)
  desactivado?: boolean;
  children: ReactNode;
}

export const Expandable = ({
  cabecera,
  inicialAbierto = false,
  desactivado = false,
  children,
}: ExpandableProps) => {
  const [abierto, setAbierto] = useState(inicialAbierto);

  if (desactivado) {
    return (
      <>
        {cabecera}
        {children}
      </>
    );
  }

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
      {abierto && (
        <div className={styles.contenido}>
          <div className={styles.contenidoInterior}>{children}</div>
        </div>
      )}
    </div>
  );
};
