import { useState, type ReactNode } from 'react';
import styles from './Expandable.module.scss';

interface ExpandableProps {
  cabecera: ReactNode;
  inicialAbierto?: boolean;
  // Pinta cabecera y children tal cual, sin plegado (p. ej. para el PDF)
  desactivado?: boolean;
  // Envuelve el botón (o la cabecera si está desactivado) en un encabezado
  encabezado?: 'h2' | 'h3' | 'h4';
  children: ReactNode;
}

export const Expandable = ({
  cabecera,
  inicialAbierto = false,
  desactivado = false,
  encabezado: Encabezado,
  children,
}: ExpandableProps) => {
  const [abierto, setAbierto] = useState(inicialAbierto);

  // Patrón acordeón WAI-ARIA: el encabezado envuelve al botón
  const conEncabezado = (contenido: ReactNode) =>
    Encabezado ? (
      <Encabezado className={styles.encabezado}>{contenido}</Encabezado>
    ) : (
      contenido
    );

  if (desactivado) {
    return (
      <>
        {conEncabezado(cabecera)}
        {children}
      </>
    );
  }

  return (
    <div className={styles.Expandable}>
      {conEncabezado(
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
        </button>,
      )}
      <div className={styles.contenido} hidden={!abierto}>
        <div className={styles.contenidoInterior}>{children}</div>
      </div>
    </div>
  );
};
