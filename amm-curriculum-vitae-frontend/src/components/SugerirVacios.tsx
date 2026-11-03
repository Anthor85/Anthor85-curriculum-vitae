import { useEffect, useRef } from 'react';

import { faltaEn } from '../helpers/textoLocalizado';
import { useTraduccion } from '../hooks/useTraduccion';
import type { TextoLocalizado } from '../interfaces/idioma.interface';
import { Button } from './Button';

import styles from './CampoLocalizado.module.scss';

export interface Traduccion {
  indice: number;
  en: string;
}

interface Props {
  valores: TextoLocalizado[];
  // Solo las posiciones traducidas: el form las aplica sobre su estado actual
  onTraducidos: (traducciones: Traduccion[]) => void;
}

// Botón de grupo para listas (hitos, extras, idiomas): traduce en una sola
// petición todos los valores con ES relleno y EN vacío.
export const SugerirVacios = ({ valores, onTraducidos }: Props) => {
  const { traducir, traduciendo, error } = useTraduccion();

  const ultimoOnTraducidos = useRef(onTraducidos);
  useEffect(() => {
    ultimoOnTraducidos.current = onTraducidos;
  });

  const pendientes = valores
    .map((valor, indice) => ({ valor, indice }))
    .filter(({ valor }) => faltaEn(valor));

  const sugerir = async () => {
    try {
      const textos = await traducir(
        pendientes.map(({ valor }) => valor.es.trim()),
      );
      ultimoOnTraducidos.current(
        pendientes.map(({ indice }, i) => ({ indice, en: textos[i] })),
      );
    } catch {
      // El mensaje ya está en `error`
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={sugerir}
        disabled={!pendientes.length || traduciendo}
        name={traduciendo ? 'Traduciendo…' : 'Sugerir EN de los vacíos'}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
};
