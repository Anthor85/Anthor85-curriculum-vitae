import { useEffect, useState } from 'react';

import type { MensajeAccion as MensajeAccionType } from '../interfaces/mensajeAccion.interface';

import styles from './MensajeAccion.module.scss';

const DURACION_ENTRADA = 1000;
const DURACION_ESPERA = 3000;
const DURACION_SALIDA = 1000;

interface Props {
  mensaje: MensajeAccionType | null;
}

const animarTexto = (
  texto: string,
  setTextoVisible: (texto: string) => void,
) => {
  let esperaSalida: ReturnType<typeof setTimeout> | undefined;
  let intervaloSalida: ReturnType<typeof setInterval> | undefined;

  let visibles = 0;
  setTextoVisible('');

  const intervaloEntrada: ReturnType<typeof setInterval> | undefined =
    setInterval(() => {
      visibles += 1;
      setTextoVisible(texto.slice(0, visibles));

      if (visibles < texto.length) return;

      clearInterval(intervaloEntrada);

      esperaSalida = setTimeout(() => {
        intervaloSalida = setInterval(() => {
          visibles -= 1;
          setTextoVisible(texto.slice(0, visibles));

          if (visibles === 0) clearInterval(intervaloSalida);
        }, DURACION_SALIDA / texto.length);
      }, DURACION_ESPERA);
    }, DURACION_ENTRADA / texto.length);

  return () => {
    clearInterval(intervaloEntrada);
    clearTimeout(esperaSalida);
    clearInterval(intervaloSalida);
  };
};

export const MensajeAccion = ({ mensaje }: Props) => {
  const [textoVisible, setTextoVisible] = useState<string>('');

  useEffect(() => {
    const texto = mensaje?.texto ?? '';

    if (!texto) {
      setTextoVisible('');
      return;
    }

    return animarTexto(texto, setTextoVisible);
  }, [mensaje]);

  return (
    <span className={styles.MensajeAccion} aria-live="polite">
      {textoVisible}
    </span>
  );
};
