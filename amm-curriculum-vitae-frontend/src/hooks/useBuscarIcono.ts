import { useCallback, useState } from 'react';
import { isAxiosError } from 'axios';

import api from '../api/api';
import type { ResultadoIcono } from '../interfaces/conocimiento.interface';

const MENSAJES_ERROR: Record<number, string> = {
  502: 'Servicio de iconos no disponible',
};

export const mensajeErrorBuscarIcono = (error: unknown): string =>
  (isAxiosError(error) && MENSAJES_ERROR[error.response?.status ?? 0]) ||
  'No se pudo buscar el icono';

// Candidatos de icono con GET /icono?q=. Si falla, deja el mensaje en
// `error` y relanza.
export const useBuscarIcono = () => {
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (q: string): Promise<ResultadoIcono[]> => {
    setBuscando(true);
    setError(null);
    try {
      const { data } = await api.get<{ resultados: ResultadoIcono[] }>(
        '/icono',
        { params: { q } },
      );
      return data.resultados;
    } catch (e) {
      setError(mensajeErrorBuscarIcono(e));
      throw e;
    } finally {
      setBuscando(false);
    }
  }, []);

  return { buscar, buscando, error };
};
