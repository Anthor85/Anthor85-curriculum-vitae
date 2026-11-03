import { useCallback, useState } from 'react';
import { isAxiosError } from 'axios';

import api from '../api/api';

const MENSAJES_ERROR: Record<number, string> = {
  429: 'Cuota de traducción agotada',
  503: 'Traducción no disponible',
};

export const mensajeErrorTraduccion = (error: unknown): string =>
  (isAxiosError(error) && MENSAJES_ERROR[error.response?.status ?? 0]) ||
  'No se pudo traducir';

// Sugerencia ES → EN con POST /traduccion. Si falla, deja el mensaje en
// `error` y relanza: quien llama no debe escribir nada en EN.
export const useTraduccion = () => {
  const [traduciendo, setTraduciendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const traducir = useCallback(async (textos: string[]): Promise<string[]> => {
    setTraduciendo(true);
    setError(null);
    try {
      const { data } = await api.post<{ textos: string[] }>('/traduccion', {
        textos,
      });
      return data.textos;
    } catch (e) {
      setError(mensajeErrorTraduccion(e));
      throw e;
    } finally {
      setTraduciendo(false);
    }
  }, []);

  return { traducir, traduciendo, error };
};
