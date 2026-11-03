import { useEffect, useRef } from 'react';

import { useTraduccion } from '../hooks/useTraduccion';
import type { TextoLocalizado } from '../interfaces/idioma.interface';
import { Button } from './Button';

import styles from './CampoLocalizado.module.scss';

interface Props {
  id: string; // "titulo" → inputs "titulo-es" y "titulo-en"
  etiqueta: string; // "Título"
  valor: TextoLocalizado;
  onChange: (valor: TextoLocalizado) => void;
  multilinea?: boolean; // textarea en vez de input
  required?: boolean; // solo afecta a ES
}

export const CampoLocalizado = ({
  id,
  etiqueta,
  valor,
  onChange,
  multilinea = false,
  required = false,
}: Props) => {
  const { traducir, traduciendo, error } = useTraduccion();

  // La traducción llega tras un await: se escribe sobre el valor y el
  // onChange más recientes, no sobre los del momento del clic.
  const ultimo = useRef({ valor, onChange });
  useEffect(() => {
    ultimo.current = { valor, onChange };
  });

  const sugerirEn = async () => {
    try {
      const [en] = await traducir([valor.es.trim()]);
      ultimo.current.onChange({ ...ultimo.current.valor, en });
    } catch {
      // El mensaje ya está en `error`
    }
  };

  const campo = (idioma: keyof TextoLocalizado) => {
    const props = {
      id: `${id}-${idioma}`,
      name: `${id}-${idioma}`,
      value: valor[idioma],
      required: idioma === 'es' && required,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => onChange({ ...valor, [idioma]: e.target.value }),
    };

    return multilinea ? (
      <textarea rows={5} {...props} />
    ) : (
      <input type="text" {...props} />
    );
  };

  return (
    <div className={styles.CampoLocalizado}>
      <div className={styles.fila}>
        <label htmlFor={`${id}-es`}>{etiqueta} (ES)</label>
        {campo('es')}
      </div>
      <div className={styles.fila}>
        <label htmlFor={`${id}-en`}>{etiqueta} (EN)</label>
        {campo('en')}
        <Button
          type="button"
          onClick={sugerirEn}
          disabled={!valor.es.trim() || traduciendo}
          name={traduciendo ? 'Traduciendo…' : 'Sugerir EN'}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
