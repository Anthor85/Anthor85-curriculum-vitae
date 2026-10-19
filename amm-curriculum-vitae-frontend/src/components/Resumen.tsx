import { useId, useState } from 'react';
import styles from './Resumen.module.scss';

// Por debajo de este largo cabe entero en el recorte móvil: no hace falta botón
const LARGO_MINIMO_PLEGABLE = 220;

interface ResumenProps {
  texto: string;
}

// Resumen profesional. En escritorio se ve entero; en móvil se recorta
// a unas líneas (CSS) y el botón lo despliega.
export const Resumen = ({ texto }: ResumenProps) => {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const plegable = texto.length > LARGO_MINIMO_PLEGABLE;

  return (
    <div className={styles.Resumen}>
      <p
        id={id}
        className={`${styles.texto} ${plegable && !abierto ? styles.recortado : ''}`}
      >
        {texto}
      </p>
      {plegable && (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={abierto}
          aria-controls={id}
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
};
