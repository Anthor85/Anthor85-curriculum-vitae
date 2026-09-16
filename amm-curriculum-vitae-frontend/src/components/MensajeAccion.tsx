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

// Remontado por key={mensaje.id}: cada mensaje empieza con el texto vacío.
const TextoAnimado = ({ texto }: { texto: string }) => {
  const [textoVisible, setTextoVisible] = useState('');

  useEffect(() => animarTexto(texto, setTextoVisible), [texto]);

  return textoVisible;
};

export const MensajeAccion = ({ mensaje }: Props) => (
  <span className={styles.MensajeAccion} aria-live="polite">
    {mensaje?.texto && <TextoAnimado key={mensaje.id} texto={mensaje.texto} />}
  </span>
);
